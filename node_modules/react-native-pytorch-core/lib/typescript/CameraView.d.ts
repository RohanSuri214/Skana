/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import * as React from 'react';
import { ViewProps } from 'react-native';
import { Image } from './ImageModule';
/**
 * Camera target resolution. It is not guaranteed that the camera runs at the
 * set target resolution, and it might pick the closest available resolution.
 *
 * {@see https://developer.android.com/reference/androidx/camera/core/ImageAnalysis.Builder#setTargetResolution(android.util.Size)}
 */
interface TargetResolution {
    /**
     * Camera resolution width in pixels.
     */
    width: number;
    /**
     * Camera resolution height in pixels.
     */
    height: number;
}
/**
 * Direction the camera faces relative to the device's screen.
 */
export declare enum CameraFacing {
    /**
     * Camera facing the opposite direction as the device's screen.
     */
    BACK = "back",
    /**
     * Camera facing the same direction as the device's screen.
     */
    FRONT = "front"
}
/**
 * Properties for the camera.
 *
 * ```typescript
 * <Camera
 *   onFrame={(image: Image) => {
 *     image.release();
 *   }}
 *   hideCaptureButton={true}
 * />
 * ```
 */
export interface CameraProps extends ViewProps {
    /**
     * Hides the capture button if set to `true`, otherwise the camera will show
     * a capture button.
     */
    hideCaptureButton?: boolean;
    /**
     * Hides the flip button if set to `true`, otherwise the camera will show
     * a flip button.
     */
    hideFlipButton?: boolean;
    /**
     * Camera target resolution. It is not guaranteed that the camera runs at the
     * set target resolution, and it might pick the closest available resolution.
     *
     * {@see https://developer.android.com/reference/androidx/camera/core/ImageAnalysis.Builder#setTargetResolution(android.util.Size)}
     */
    targetResolution?: TargetResolution;
    /**
     * Direction the camera faces relative to the device's screen.
     */
    facing?: CameraFacing;
    /**
     * Callback with an [[Image]] after capture button was pressed.
     *
     * @param image An [[Image]] reference.
     */
    onCapture?(image: Image): void;
    /**
     * Callback when the camera delivers an [[Image]].
     *
     * :::caution
     *
     * Needs to call [[Image.release]] to receive the next frame. The camera
     * preview will continue to render updates, but new [[Image]] frames will be
     * omitted until [[Image.release]] is called.
     *
     * :::
     *
     * @param image An [[Image]] reference.
     */
    onFrame?(image: Image): void;
}
/**
 * A camera component with [[CameraProps.onCapture]] and [[CameraProps.onFrame]] callbacks.
 * To programmatically trigger a capture, call the [[takePicture]] function.
 *
 * ```typescript
 * export default function App() {
 *   const {imageClass, processImage} = useImageClassification(
 *     require('./resnet18.ptl'),
 *   );
 *
 *   const handleFrame = useCallback(
 *     async (image: Image) => {
 *       await processImage(image);
 *       image.release();
 *     },
 *     [processImage],
 *   );
 *
 *   return (
 *     <>
 *       <Camera
 *         style={styles.camera}
 *         onFrame={handleFrame}
 *         hideCaptureButton={true}
 *       />
 *       <Text>{imageClass}</Text>
 *     </>
 *   );
 * }
 * ```
 *
 * @component
 */
export declare class Camera extends React.PureComponent<CameraProps> {
    private cameraRef;
    /** @internal */
    constructor(props: CameraProps);
    /**
     * The [[takePicture]] function captures an image from the camera and then
     * trigger the [[onCapture]] callback registered on the [[Camera]]
     * component.
     *
     * ```typescript
     * export default function CameraTakePicture() {
     *   const cameraRef = React.useRef<Camera>(null);
     *
     *   async function handleCapture(image: Image) {
     *     // Use captured image before releasing it.
     *     image.release();
     *   }
     *
     *   function handleTakePicture() {
     *     const camera = cameraRef.current;
     *     if (camera != null) {
     *       camera.takePicture();
     *     }
     *   }
     *
     *   return (
     *     <>
     *       <Camera
     *         ref={cameraRef}
     *         onCapture={handleCapture}
     *         hideCaptureButton={true}
     *         style={StyleSheet.absoluteFill}
     *         targetResolution={{width: 480, height: 640}}
     *         facing={CameraFacing.BACK}
     *       />
     *       <Button title="Take Picture" onPress={handleTakePicture} />
     *     </>
     *   );
     * }
     * ```
     */
    takePicture(): void;
    flip(): void;
    private handleOnCapture;
    private handleOnFrame;
    /** @internal */
    render(): React.ReactNode;
}
export {};
