function handleResponseError(response) {
  if (response.ok) {
    return;
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
  console.warn(error.response);
  throw error;
}

export default handleResponseError;
