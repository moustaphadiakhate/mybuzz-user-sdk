import RNFetchBlob from 'react-native-fetch-blob';

export async function fetchPictureToServers(data) {
  RNFetchBlob.fetch(
    'POST',
    `${SERVER_ADRESS}/input`,
    {
      Authorization: 'Bearer access-token',
      otherHeader: 'foo',
      'Content-Type': 'multipart/form-data',
    },
    [
      // element with property `filename` will be transformed into `file` in form data
      {name: 'file', filename: 'upload.jpg', data: data.base64},
    ],
  )
    // listen to upload progress event
    .uploadProgress({interval: 4}, (written, total) => {
      console.log('uploaded', written / total);
    })
    // listen to download progress event
    .progress((received, total) => {
      console.log('progress', received / total);
    })
    .then(resp => {
      //console.log(Object.keys(resp));
    })
    .catch(err => {
      console.log(err);
    });
}

export async function checkFile(destName, fName) {
  let dirs = RNFetchBlob.fs.dirs;
  const PATH_OF_FILE = `${dirs.DocumentDir}/${destName}/${fName}`;
  try {
    let result = await RNFetchBlob.fs.exists(PATH_OF_FILE);
    console.log('[MYBUZZ::CLIENT] GET FILES ', TRACK_FOLDER, result);
    return result;
  } catch (error) {
    console.log('[MYBUZZ::CLIENT] GET FILES error ', TRACK_FOLDER);
    return [];
  }
}

export async function getFile(destName, fName) {
  let dirs = RNFetchBlob.fs.dirs;
  const TRACK_FOLDER = `${dirs.DocumentDir}/${destName}/${fName}`;

  try {
    let result = await RNFetchBlob.fs.ls(TRACK_FOLDER);
    console.log('[MYBUZZ::CLIENT] GET FILE ', TRACK_FOLDER, result);
    return result;
  } catch (error) {
    console.log('[MYBUZZ::CLIENT] GET FILE error ', TRACK_FOLDER);
    return [];
  }
}

export async function getFiles(destName) {
  let dirs = RNFetchBlob.fs.dirs;
  const TRACK_FOLDER = `${dirs.DocumentDir}/${destName}`;
  try {
    let result = await RNFetchBlob.fs.ls(TRACK_FOLDER);
    console.log('[MYBUZZ::CLIENT] GET FILES ', TRACK_FOLDER, result);
    return result;
  } catch (error) {
    console.log('[MYBUZZ::CLIENT] GET FILES error ', TRACK_FOLDER);
    return [];
  }
}

export function loadFileFromServers(destName, FileName, url) {
  return new Promise(resolve => {
    RNFetchBlob.config({path: destName})
      .fetch('GET', `${url}/${FileName}`, {
        //some headers ..
      })
      // listen to download progress event
      .progress((received, total) => {
        console.log('progressing fetching file ' + FileName, received / total);
      })
      .then(res => {
        let status = res.info().status;
        if (status == 200) {
          console.log('[MYBUZZ::CLIENT] loadFile file saved ', res.path());
          resolve(res.path());
        }
        res.flush();
        resolve(undefined);
      })
      .catch(err => console.log(err));
  });
}
