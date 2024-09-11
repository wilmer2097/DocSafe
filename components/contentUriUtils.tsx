import { NativeModules, Platform } from 'react-native';
const { ContentUriHelper } = NativeModules;

export const getContentUriPath = async (contentUri: string): Promise<string> => {
  if (Platform.OS === 'android') {
    try {
      return await ContentUriHelper.getPath(contentUri);
    } catch (err) {
      console.error('Error converting content URI:', err);
      throw err;
    }
  }
  return contentUri;
};
