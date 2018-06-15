import { FileSystem } from 'expo';

const words = [
  'come',
  'get',
  'give',
  'go',
  'keep',
  'let',
  'make',
  'put',
  'seem',
  'take',
  'be',
  'do',
  'have',
  'say',
  'see',
  'send',
  'may',
  'will',
  'about',
  'across',
  'after',
  'against',
  'among',
  'at',
  'before',
  'between',
  'by',
  'down',
  'from',
  'in',
  'off',
  'on',
  'over',
  'through',
  'to',
];

const getServerUri = fileName => `https://www.englishdom.com/staticus/${fileName}.mp3`;
const getLocalUri = fileName => `${FileSystem.documentDirectory}${fileName}.mp3`;

export default class Files {
  static load(callback) {
    Promise.all(
      words.map(word => FileSystem.downloadAsync(getServerUri(word), getLocalUri(word)))
    ).then(callback);
  }

  static getRandomFileUri() {
    const index = Math.floor(Math.random() * words.length);
    console.log(index, words[index]);
    return getLocalUri(words[index]);
  }
}
