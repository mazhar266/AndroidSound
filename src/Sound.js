import { Audio } from 'expo';
import { Platform, AppState } from 'react-native';
// import SoundCache from 'Services/SoundCache';
import { FileSystem } from 'expo';

export const AUDIO_LOADING = 'AUDIO_LOADING';
export const AUDIO_UNLOADED = 'AUDIO_UNLOADED';
export const AUDIO_PLAYING = 'AUDIO_PLAYING';
export const AUDIO_STOPPED = 'AUDIO_STOPPED';
export const AUDIO_BUFFERING = 'AUDIO_BUFFERING';
export const AUDIO_PAUSED = 'AUDIO_PAUSED';
export const AUDIO_ERROR = 'AUDIO_ERROR';

const isIOS = Platform.OS === 'ios';

const IOS_FIX_INTERVAL = 1000;

Audio.setAudioModeAsync({
  playsInSilentModeIOS: true,
  shouldDuckAndroid: true,
  allowsRecordingIOS: false,
  interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
  interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
});

export class SuperSound {
  static lastPlayTime = Date.now();
  static nameIndex = 0;
  static getName() {
    SuperSound.nameIndex += 1;
    return `SuperSound_${SuperSound.nameIndex}`;
  }
  isKilled = false;
  isLoaded = false;
  isPlaying = false;

  constructor(options) {
    this.name = SuperSound.getName();
    console.log('Constructor', this.name);
    this.soundId = options.soundId;
    this.callback = options.callback;
    this.volume = options.volume || 1;
    this.keepLoaded = options.keepLoaded || false;
    this.start(options);
  }
  start = async options => {
    try {
      if (options.fileName) {
        // await this.debounce();
        // const localUri = await this.getUriFromCache(options);
        const localUri = options.fileName;
        if (!this.isKilled) this.create();
        if (!this.isKilled) this.setCb();
        if (!this.isKilled) await this.load(localUri);
        if (!this.isKilled) await this.play();
      } else if (options.fromStatic) {
        if (!this.isKilled) this.create();
        if (!this.isKilled) this.setCb();
        if (!this.isKilled) await this.loadFromStatic(options.fromStatic);
        if (!this.isKilled) await this.play();
      } else {
        this.sendStatus(AUDIO_STOPPED);
      }
    } catch (error) {
      console.log('>>>>>>>> ALARM', error);
      this.sendStatus(AUDIO_STOPPED);
    }
  };

  // remove sound instance
  remove = async () => {
    // console.log(this.name, 'remove func.', this.isKilled);
    this.sendStatus(AUDIO_STOPPED);

    if (this.isKilled || this.keepLoaded) return;

    this.isKilled = true;
    this.callback = null;

    if (this.soundObject) {
      this.soundObject.setOnPlaybackStatusUpdate(null);

      await this.stop();
      await this.unload();

      delete this.soundObject;
    }
  };

  // getUriFromCache = async ({ fileName, uri }) => {
  //   this.sendStatus(AUDIO_LOADING);
  //   const localUri = await SoundCache.loadSound(fileName, uri);
  //   return localUri;
  // };

  create = () => {
    this.soundObject = new Audio.Sound();
  };

  setCb = () => {
    this.soundObject.setOnPlaybackStatusUpdate(this.onPlaybackStatusUpdate);
  };

  load = async uri => {
    console.log({ uri });
    FileSystem.getInfoAsync(uri, { size: true }).then(result => {
      console.log('Проверяем есть ли звуковой файл:', result);
    });

    await this.soundObject.loadAsync({ uri }, { volume: this.volume });
    this.isLoaded = true;
    // если нужно выгрузить звук, в момент когда он загружался
    console.log('load, this.isKilled:', this.isKilled);
    if (this.isKilled) await this.unload();
  };

  loadFromStatic = async fileId => {
    await this.soundObject.loadAsync(fileId, { volume: this.volume }, true);
    this.isLoaded = true;
    if (this.isKilled) await this.unload();
  };

  unload = async () => {
    // console.log(this.name, 'unload func.', this.isLoaded);
    if (this.isLoaded && this.soundObject) {
      await this.soundObject.unloadAsync();
      this.isLoaded = false;
    }
  };

  play = async () => {
    try {
      console.log('<< play >> this.isLoaded:', this.isLoaded);
      const status = await this.soundObject.getStatusAsync();
      console.log(status);

      if (this.isLoaded) {
        this.sendStatus(AUDIO_PLAYING);
        this.isPlaying = true;
        await this.soundObject.playAsync();
        console.log('done');
      }
      // this.isPlaying = false;
    } catch (error) {
      console.log('>>>>>>>> ALARM PLAY', error);
    }
  };

  stop = async () => {
    if (this.isPlaying) {
      await this.soundObject.stopAsync();
      this.isPlaying = false;
    }
  };

  sendStatus(status) {
    this.status = status;

    // console.log('sendStatus>>', this.name, this.status, !!this.callback);

    if (this.callback) {
      this.callback(status, this.soundId);
    }
  }

  clearCallback = () => {
    this.callback = undefined;
  };

  clearTimer = () => {
    if (this.timer) clearTimeout(this.timer);
  };

  sendStatusStop = () => {
    this.remove();
  };

  onPlaybackStatusUpdate = playbackStatus => {
    if (isIOS && this.isLoaded) {
      this.clearTimer();
      this.timer = setTimeout(this.sendStatusStop, IOS_FIX_INTERVAL);
    }
    console.log('playbackStatus', playbackStatus);
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus.error) {
        console.log(`Encountered a fatal error during playback: ${playbackStatus.error}`);
        // Send Expo team the error on Slack or the forums so we can help you debug!
      }
    } else {
      // Update your UI for the loaded state

      if (playbackStatus.isPlaying) {
        // console.log('playbackStatus.isPlaying');
        // Update your UI for the playing state
      } else {
        // Update your UI for the paused state
      }

      if (playbackStatus.isBuffering) {
        // Update your UI for the buffering state
      }

      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        // The player has just finished playing and will stop. Maybe you want to play something else?
        // console.log('HOP THE END');
        this.remove();
      }
    }
  };
}

export class SoundManager {
  currentSound = null;

  constructor() {
    AppState.addEventListener('change', this.handleAppChange);
  }

  clearCallback = () => {
    if (this.currentSound) this.currentSound.clearCallback();
  };

  handleAppChange = nextAppState => {
    if (nextAppState !== 'active') {
      this.stop();
    }
  };

  play = async options => {
    await this.stop();

    this.currentSound = new SuperSound(options);
  };

  stop = async () => {
    if (this.currentSound) await this.currentSound.remove();
  };
}

export const SOUND_MANAGER = new SoundManager();
