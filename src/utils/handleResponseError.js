function handleResponseError(response) {
  if (response.ok) {
    return response;    
  }
  const error = new Error();
  if (response.data) {
    error.message = response.data.message;
    error.code = response.data.code;
  } else {
    error.message = "No response from server. Check your internet connection";
  }
  error.status = response.status;
  error.response = response;
  // console.log(error.response);
  //throw error;
  return {error: true, data : error};
}

export default handleResponseError;
