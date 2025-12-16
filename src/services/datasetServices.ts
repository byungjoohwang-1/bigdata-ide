import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export class DatasetService {
  async uploadDataset(
    file: File,
    examId: string,
    problemId: string
  ): Promise<string> {
    const storageRef = ref(
      storage,
      `datasets/${examId}/${problemId}/${file.name}`
    );

    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    return url;
  }

  async getDatasetURL(path: string): Promise<string> {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  }
}