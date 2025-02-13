const connectToCouchbase = require('../../../../database/connection');
const logger = require('../../../logger/logger');
const { getName } = require('../../../logger/logFunctionName');
// const moment = require('moment')
const AmazonCognitoIdentity = require( 'amazon-cognito-identity-js' );
const EV = require('../../../environment');
const poolData = {
	UserPoolId: EV.USER_POOL_ID, // Your user pool id here
	ClientId: EV.CLIENT_ID, // Your client id here
};
const pool_region = EV.POOL_REGION;
const userPool = new AmazonCognitoIdentity.CognitoUserPool( poolData );

async function loginUser ( event ) {
	var email = event.email;
	var password = event.password;

	return new Promise( function ( resolve, reject ) {
		var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
			{
				Username: email,
				Password: password,
			},
		);

		var userData = {
			Username: email,
			Pool: userPool,
		};

		var cognitoUser = new AmazonCognitoIdentity.CognitoUser( userData );
		cognitoUser.authenticateUser( authenticationDetails, {
			onSuccess: function ( result ) {
				// console.log( 'in login user111::' + JSON.stringify( result ) );

				var response = {
					status: true,
					message: 'Login Successful',
					result: result,
				};
				resolve( response );
				return;
			},
			onFailure: function ( err ) {
				// console.log( 'in loginfailure123 ::' + JSON.stringify( err ) );
				var response = {};
				if ( err.code ) {
					response = { status: false, message: err.message, code: err.code };
				} else {
					response = {
						status: false,
						message: 'Please Enter Valid Details',
						code: 'UserNotFoundException',
					};
				}

				resolve( response );

				return;
			},
		} );
	} );
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