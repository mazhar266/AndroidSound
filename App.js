import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Files from './src/Files';
import { SOUND_MANAGER as SoundManager } from './src/Sound';

const s = StyleSheet.create({
  buttonStyle: { margin: 10, padding: 20, backgroundColor: 'yellow', borderRadius: 5 },
});

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.soundId = 0;
    this.state = { filesLoaded: false };
    Files.load(() => {
      this.setState({ filesLoaded: true });
    });
  }

  handlePlaySound = () => {
    const fileUri = Files.getRandomFileUri();
    this.soundId += 1;
    SoundManager.play({
      fileName: fileUri,
      soundId: this.soundId,
      callback: this.handleSoundStatus,
    });

    console.log('handlePlaySound');
  };

  handleSoundStatus = (...args) => {
    console.log('handleSoundStatus', args);
  };

  handleStressTest = () => {
    let count = 0;
    const timer = setInterval(() => {
      this.handlePlaySound();
      count++;
      if (count > 30) clearInterval(timer);
    }, 300);
  };

  render() {
    return (
      <View style={styles.container}>
        <Text>Simple Android ExoPlayer BugApp</Text>
        <Text>Files Loaded: {String(this.state.filesLoaded)}</Text>
        {this.state.filesLoaded && (
          <View>
            <TouchableOpacity style={s.buttonStyle} onPress={this.handlePlaySound}>
              <Text>Play Random Sound</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.buttonStyle} onPress={this.handleStressTest}>
              <Text>Stress test</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
