exports.getName = () => {
    const OS = process.platform;
    var stack = new Error().stack,
        caller = stack.split('\n')[2].trim();
    let functionName = caller.split('.')[1].split(' ')[0];
    let indexOfStr = "/";
    if (OS === 'win32')
        indexOfStr = "\\";
    let fileName = caller.substring(caller.lastIndexOf(indexOfStr) + 1, caller.length).split(':')[0];
    return { "functionName": functionName, "fileName": fileName };
}