/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import { NativeModules } from 'react-native';
import { toPlainNativeJSRef } from '../NativeJSRef';

const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');

const {
  PyTorchCoreAudioModule: AudioModule
} = NativeModules;
export const wrapRef = ref => ({ ...ref,

  play() {
    return AudioModule.play(ref);
  },

  pause() {
    return AudioModule.pause(ref);
  },

  stop() {
    return AudioModule.stop(ref);
  },

  getDuration() {
    return AudioModule.getDuration(ref);
  },

  async release() {
    return await AudioModule.release(ref);
  }

});
export const AudioUtil = {
  /**
   * Returns the native state of audio recording.
   *
   * ```typescript
   * const isRecording = await AudioUtil.isRecording();
   * ```
   */
  isRecording() {
    return AudioModule.isRecording();
  },

  /**
   * Records an audio of a specific time duration.
   *
   * ```typescript
   * AudioUtil.startRecord();
   * ```
   */
  startRecord() {
    AudioModule.startRecord();
  },

  /**
   * Stops an active audio recording session.
   *
   * ```typescript
   * const audio: Audio = await AudioUtil.stopRecord();
   * ```
   *
   * @returns A promise resolving into an [[Audio]] or null
   */
  async stopRecord() {
    const ref = await AudioModule.stopRecord();

    if (ref != null) {
      return wrapRef(ref);
    }

    return null;
  },

  /**
   * Saves an audio to a file.
   *
   * ```typescript
   * const path: string = await AudioUtil.toFile(audio);
   * ```
   *
   * @param audio Audio to save.
   * @returns path Path to the audio file.
   */
  async toFile(audio) {
    // TODO(T122223365) Temporary solution to make the toFile function work
    // with either NativeJSRef audio or true native audio.
    //
    // Without this reassignment of just the image ID, the bridge will
    // eventually throw an error because it can't serialize the the native
    // audio.
    const audioRef = toPlainNativeJSRef(audio);
    return await AudioModule.toFile(audioRef);
  },

  /**
   * The `fromFile` function loads an [[Audio]] at the filepath (e.g., stored
   * on the file system).
   *
   * ```typescript
   * const audio: Audio = await AudioUtil.fromFile('/data/0/pytorch/audio.wav');
   * ```
   *
   * @param filePath The file path to the audio.
   * @returns A promise resolving into an [[Audio]].
   */
  async fromFile(filePath) {
    const ref = await AudioModule.fromFile(filePath);
    return wrapRef(ref);
  },

  /**
   * The `fromBundle` function loads an [[Audio]] that is bundled with the
   * React Native app bundle. The function param is a `require` with a relative
   * path (the path is relative to the file that contains the
   * [[AudioUtil.fromBundle]] call)
   *
   * ```typescript
   * const audioAsset = require('../../assets/audio/audio_file.wav');
   * const audio: Audio = await AudioUtil.fromBundle(audioAsset);
   * ```
   *
   * @param audioPath The audio path (i.e., a `require`).
   * @returns A promise resolving into an [[Audio]].
   */
  async fromBundle(path) {
    const source = resolveAssetSource(path);
    const ref = await AudioModule.fromBundle(source.uri);
    return wrapRef(ref);
  }

};
//# sourceMappingURL=AudioModule.js.map