/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import { NativeJSRef } from '../NativeJSRef';
export interface Audio extends NativeJSRef {
    /**
     * Play an audio.
     */
    play(): void;
    /**
     * Pause an audio.
     */
    pause(): void;
    /**
     * Stop the current playing audio.
     */
    stop(): void;
    /**
     * Get the duration of an audio in ms.
     */
    getDuration(): number;
    /**
     * Until explicitly released, an [[Audio]] will have a reference in memory.
     * Not calling [[Audio.release]] can eventually result in an
     * `OutOfMemoryException`.
     *
     * :::caution
     *
     * While this is an `async` function, it does not need to be `await`ed. For
     * example, the `GC` on Android will eventually free the allocated memory.
     *
     * :::
     */
    release(): Promise<void>;
}
export declare const wrapRef: (ref: NativeJSRef) => Audio;
export declare const AudioUtil: {
    /**
     * Returns the native state of audio recording.
     *
     * ```typescript
     * const isRecording = await AudioUtil.isRecording();
     * ```
     */
    isRecording(): Promise<boolean>;
    /**
     * Records an audio of a specific time duration.
     *
     * ```typescript
     * AudioUtil.startRecord();
     * ```
     */
    startRecord(): void;
    /**
     * Stops an active audio recording session.
     *
     * ```typescript
     * const audio: Audio = await AudioUtil.stopRecord();
     * ```
     *
     * @returns A promise resolving into an [[Audio]] or null
     */
    stopRecord(): Promise<Audio | null>;
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
    toFile(audio: Audio): Promise<string>;
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
    fromFile(filePath: string): Promise<Audio>;
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
    fromBundle(path: number): Promise<Audio>;
};
