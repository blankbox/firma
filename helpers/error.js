//Error constructor with status - returned in the graphql error array
//Use for errors you wish to expose to the client
function PublicError (name, message, status) {
  Error.captureStackTrace(this, this.constructor);
  this.name = name;
  this.message = message;
  this.status = status;
}

PublicError.prototype = Error.prototype;

const errorHandler = (errorArray) => {
  let status, message;
  //TODO handle all errors in the array
  let err = errorArray[0];

  //If it isn't a graphql generated error, the original error is attached
  if (err.originalError) {

    //Only pubic errors should be shown to the client
    if (err.originalError instanceof PublicError) {
      status = err.originalError.status;
      message = err.originalError.message;
    } else {
      //TODO extend to deal with additional custom error types
      status = 400;
      message = 'An error occured'
    }

  } else {
    message = err.message;
    status = 400;
  }


  return {status: status, message:message};
};


module.exports = {
  errorHandler:errorHandler,
  PublicError: PublicError
}
