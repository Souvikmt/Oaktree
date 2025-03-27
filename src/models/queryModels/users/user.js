const connectToCouchbase = require('../../../../database/connection');
const logger = require('../../../logger/logger');
const { getName } = require('../../../logger/logFunctionName');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const EV = require('../../../environment');
const AWS = require("aws-sdk");

const poolData = {
    UserPoolId: EV.USER_POOL_ID,
    ClientId: EV.CLIENT_ID,
};
const pool_region = EV.POOL_REGION;
const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({ region: pool_region });

const bcrypt = require( 'bcrypt' );
const saltRounds = 10;

/***:- generate hash password -:***/
async function passwordHash ( password ) {
	let hashPass = new Promise( function ( Resolve, myReject ) {
		bcrypt.hash( password, saltRounds, ( err, hash ) => {
			Resolve( hash );
		} );
	} );

	return hashPass;

};

async function loginUser(event) {
    var email = event.email;
    var password = event.password;

    return new Promise((resolve, reject) => {
        var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: email,
            Password: password,
        });

        var userData = {
            Username: email,
            Pool: userPool,
        };

        var cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                resolve({
                    status: true,
                    message: 'Login Successful',
                    result: result,
                });
            },
            onFailure: function (err) {
                resolve({
                    status: false,
                    message: err.message || 'Please Enter Valid Details',
                    code: err.code || 'UserNotFoundException',
                });
            },
        });
    });
}

exports.loginCheck = async (params, next) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);
    try {
        var cluster = await connectToCouchbase();
        cluster = cluster.db2;
        var bucket = cluster.bucket('userdatabase');
        params = params.data;
        //cogitnor
        var output = await loginUser( params );

        // console.log( 'output::', output );

        // var email = params.email;
        var email = params.email.toLowerCase(); //remove case sensetive
        var password = params.password;

        var loginType = 'Patient';
        if ( params.loginType ) {
            loginType = params.loginType;
        }

        if ( output[ 'status' ] ) {
            //  cluster.close();
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return {data: output };
        } else {
            // let query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Patient_Login_Details' and userdatabase.email = $1`;
            let query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Patient_Login_Details' and lower(userdatabase.email) = $1`;

            if ( loginType == 'Patient' ) {
                // query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Patient_Login_Details' and userdatabase.email = $1`;
                query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Patient_Login_Details' and lower(userdatabase.email) = $1`;
            } else if ( loginType == 'Admin' ) {
                // query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Admin_Login_Details' and userdatabase.email = $1`;
                query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Admin_Login_Details' and lower(userdatabase.email) = $1`;
            } else if ( loginType == 'Organization' ) {
                // query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Organization_Login_Details' and userdatabase.email = $1`;
                query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Organization_Login_Details' and lower(userdatabase.email) = $1`;
            } else {
                // query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Practitioner_Login_Details' and userdatabase.email = $1`;
                query = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='Practitioner_Login_Details' and lower(userdatabase.email) = $1`;
            }
            const options = { parameters: [ email ] };
            let results = await cluster.query( query, options );
            let response = {};
            let resultjson = results.rows[ 0 ];

            if ( results.rows.length == 0 ) {
                response = {
                    status: false,
                    message: 'Check Your Login Details',
                    details: {},
                };
            } else {
                if ( loginType == 'Admin' ) {
                    resultjson[ 'roles' ] = null;
                    // console.log( 'resultjson in ifff;:', resultjson[ 'roleId' ] );

                    let roleid = resultjson[ 'roleId' ];

                    if ( roleid ) {
                        let rolesquery = `SELECT meta(userdatabase).id AS docid,userdatabase.* FROM \`userdatabase\` WHERE   userdatabase.resourceType='RolePermission' and userdatabase.id = $1`;
                        const roleoptions = { parameters: [ roleid ] };

                        let rolesresults = await cluster.query( rolesquery, roleoptions );
                        let rolesjon = rolesresults.rows[ 0 ];
                        resultjson[ 'roles' ] = rolesjon;
                    } else {
                        resultjson[ 'roles' ] = null;
                    }
                } else {
                    // console.log( 'resultjson in elseee;:', resultjson[ 'roleId' ] );
                }
                let initialconfmsg = {
                    type: 'LOGIN_EMAIL',
                    firstName: resultjson[ 'firstName' ],
                    lastName: resultjson[ 'lastName' ],
                    email: resultjson[ 'email' ],
                };

                response = {
                    status: true,
                    message: 'Login Successful',
                    details: JSON.stringify( resultjson ),
                    tokenresult: JSON.stringify( output[ 'result' ] ),
                };
            }
            logger.info("* Ending %s of %s *", getName().functionName, getName().fileName);
            return ({data: response });
        }
    } catch (err) {
        logger.error("*** Error in %s of %s ***", getName().functionName, getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ "message": "Internal Server Error", success: false });
    }
}

// Local Logout (Only logs out from the current session)
exports.localSignOut = async (params, next, callback) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);

    try {
        const cognitoUser = userPool.getCurrentUser();

        if (!cognitoUser) {
            throw new Error("No active session found for the user.");
        }

        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid()) {
                throw new Error("Session has already been revoked or expired.");
            }

            cognitoUser.signOut();
            logger.info("*** User logged out locally ***");
            callback({ success: true, message: "Local logout successful" });
        });

    } catch (err) {
        logger.error("*** Error in signOut of %s ***", getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ success: false, message: err.message || JSON.stringify(err) });
    }
};

// Global Logout (Logs out user from ALL devices)
exports.globalSignOut = async (params, next, callback) => {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);

    try {
        console.log('params:', params);
        const { AccessToken } = params;

        if (!AccessToken) {
            throw new Error("Access token is required for global logout.");
        }

        await cognitoIdentityServiceProvider.globalSignOut({
            AccessToken: AccessToken
        }).promise();

        logger.info("*** User logged out globally ***");
        callback({ success: true, message: "Global logout successful" });

    } catch (err) {
        logger.error("*** Error in globalSignOut of %s ***", getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ success: false, message: err.message || JSON.stringify(err) });
    }
};

exports.refreshToken = async function (params, next, callback) {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);

    try {
        console.log(params)
        const { refreshToken } = params; // ✅ No email required

        if (!refreshToken) {
            throw new Error("Refresh token is required.");
        }

        const authParams = {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            ClientId: EV.CLIENT_ID,
            AuthParameters: {
                'REFRESH_TOKEN': refreshToken
            }
        };

        const authResponse = await cognitoIdentityServiceProvider.initiateAuth(authParams).promise();

        logger.info("*** Refresh token successful ***");
        callback({ success: true, data: authResponse.AuthenticationResult });

    } catch (err) {
        logger.error("*** Error in globalSignOut of %s ***", getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ success: false, message: err.message || JSON.stringify(err) });
    }
};

exports.forgotPassword = async function (params, next, callback) {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);

    try {
        const { email } = params.data;

        if (!email) {
            throw new Error("Email is required for forgot password.");
        }

        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.forgotPassword({
            onSuccess: function (data) {
                logger.info("*** Forgot password successful ***");
                callback({ success: true, message: `Verification code has been sent to mail: ${email}` });
            },
            onFailure: function (err) {
                logger.error("*** Error in forgotPassword of %s ***", getName().fileName);
                logger.error(err.message || JSON.stringify(err));
                next({ status: err.statusCode, success: false, message: err.message || JSON.stringify(err) });
            }
        });

    } catch (err) {
        logger.error("*** Error in forgotPassword of %s ***", getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ success: false, message: err.message || JSON.stringify(err) });
    }
}

exports.resetPassword_bk = async function (params, next, callback) {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);

    try {
        const { email, verificationCode, newPassword } = params.data;

        if (!email || !verificationCode || !newPassword) {
            throw new Error("Email, verification code and new password are required for reset password.");
        }

        const userData = {
            Username: email,
            Pool: userPool
        };

        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: function (data) {
                logger.info("*** Reset password successful ***");
                callback({ success: true, message: 'Password updated successfully' });
            },
            onFailure: function (err) {
                logger.error("*** Error in resetPassword of %s ***", getName().fileName);
                logger.error(err.message || JSON.stringify(err));
                next({ status: err.statusCode, success: false, message: err.message || JSON.stringify(err) });
            }
        });

    } catch (err) {
        logger.error("*** Error in resetPassword of %s ***", getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ success: false, message: err.message || JSON.stringify(err) });
    }
}

exports.resetPassword = async function (params, next, callback) {
    logger.info("*** Starting %s of %s ***", getName().functionName, getName().fileName);

    try {
        const { email, verificationCode, password } = params.data;
        console.log("email, verificationCode, newPassword", params.data);
        let newPassword = password;
        if (!email || !verificationCode || !newPassword) {
            throw new Error("Email, verification code, and new password are required.");
        }

        const userData = { Username: email, Pool: userPool };
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

        cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: async function () {
                logger.info("*** Cognito password reset successful ***");

                try {
                    // Connect to Couchbase
                    var cluster = await connectToCouchbase();
                    cluster = cluster.db2;
                    var bucket = cluster.bucket('userdatabase');
                    var collection = bucket.defaultCollection();
                    console.log("====",1)
                    // Determine user type and select query
                    const userTypeMap = {
                        "Patient": "Patient_Login_Details",
                        "Admin": "Admin_Login_Details",
                        "Organization": "Organization_Login_Details",
                        "Practitioner": "Practitioner_Login_Details"
                    };

                    const userType = params.userType || "Practitioner"; // Default if not provided
                    const resourceType = userTypeMap[userType] || "Practitioner_Login_Details";

                    const query = `SELECT meta(userdatabase).id AS docid, userdatabase.* 
                                   FROM \`userdatabase\` 
                                   WHERE userdatabase.resourceType=$1 AND userdatabase.email=$2`;
                                   console.log("====",2)

                    const options = { parameters: [resourceType, email] };
                    let results = await cluster.query(query, options);
                    console.log("====",3)

                    if (results.rows.length === 0) {
                        throw new Error("User not found in the database.");
                    }

                    let recordData = results.rows[0];
                    console.log("recordData", recordData)
                    let recordId = recordData['id'];
                    console.log("recordId", recordId)

                    // Hash new password and update record
                    recordData['password'] = await passwordHash(newPassword);
                    await collection.replace(recordId, recordData, { timeout: 500 });

                    logger.info("*** Password updated successfully in Couchbase ***");
                    callback({ success: true, message: 'Password updated successfully' });

                } catch (dbErr) {
                    logger.error("*** Error updating Couchbase password ***");
                    logger.error(dbErr.message || JSON.stringify(dbErr));
                    next({ success: false, message: "Password updated in Cognito, but failed in database." });
                }
            },

            onFailure: function (err) {
                logger.error("*** Error in resetPassword of %s ***", getName().fileName);
                logger.error(err.message || JSON.stringify(err));
                next({ status: err.statusCode, success: false, message: err.message || JSON.stringify(err) });
            }
        });

    } catch (err) {
        logger.error("*** Error in resetPassword of %s ***", getName().fileName);
        logger.error(err.message || JSON.stringify(err));
        next({ success: false, message: err.message || JSON.stringify(err) });
    }
};
