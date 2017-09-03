//Error constructor with status - returned in the graphql error array
//Use for errors you wish to expose to the client
function PublicError (name, message, status) {
  Error.captureStackTrace(this, this.constructor);
  this.name = name;
  this.message = message;
  this.status = status;
  this.type = 'public';
}

PublicError.prototype = Error.prototype;

function PrivateError (name, message, status) {
  this.name = name;
  this.message = message;
  this.status = status;
  this.type= 'private';
}

PrivateError.prototype = Error.prototype;

const errorHandler = (errorArray) => {
  let status, message;
  //TODO handle all errors in the array
  let errorReturnArray = [];
  let statusArray = [];
  for (let err of errorArray) {
      //If it isn't a graphql generated error, the original error is attached
    if (err.originalError) {
      status = err.originalError.status || 500;
      if (err.originalError.type == 'public') {
        message = err.originalError.message;
      } else {
        message = 'An error occured';
      }

    } else {
      message = err.message;
      status = 408;
    }

    if (!message) {message = 'Unknown error';}

    statusArray.push(status),
    errorReturnArray.push({
      message:message,
      locations:err.locations || {},
      path: err.path || {}
    });

  }

  let s = Math.max(...statusArray);
  return {status: s, errors: errorReturnArray};

};


module.exports = {
  errorHandler:errorHandler,
  PublicError: PublicError,
  PrivateError: PrivateError
};
