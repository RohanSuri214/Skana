function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import * as React from 'react';
import { findNodeHandle, requireNativeComponent, UIManager } from 'react-native';
import { wrapRef } from './ImageModule';

/**
 * Direction the camera faces relative to the device's screen.
 */
export let CameraFacing;
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

(function (CameraFacing) {
  CameraFacing["BACK"] = "back";
  CameraFacing["FRONT"] = "front";
})(CameraFacing || (CameraFacing = {}));

const nativeCameraViewName = 'PyTorchCoreCameraView';
const PyTorchCoreCameraView = requireNativeComponent(nativeCameraViewName);
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

export class Camera extends React.PureComponent {
  /** @internal */
  constructor(props) {
    super(props);

    _defineProperty(this, "cameraRef", void 0);

    _defineProperty(this, "handleOnCapture", event => {
      const {
        onCapture
      } = this.props;
      const {
        nativeEvent
      } = event;
      const {
        ID
      } = nativeEvent;
      const ref = {
        ID
      };
      const image = wrapRef(ref);
      onCapture != null && onCapture(image);
    });

    _defineProperty(this, "handleOnFrame", event => {
      const {
        onFrame
      } = this.props;
      const {
        nativeEvent
      } = event;
      const {
        ID
      } = nativeEvent;
      const ref = {
        ID
      };
      const image = wrapRef(ref);
      onFrame != null && onFrame(image);
    });

    this.cameraRef = /*#__PURE__*/React.createRef();
  }
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


  takePicture() {
    if (this.cameraRef.current) {
      const takePictureCommandId = UIManager.getViewManagerConfig(nativeCameraViewName).Commands.takePicture;
      const cameraViewHandle = findNodeHandle(this.cameraRef.current);
      UIManager.dispatchViewManagerCommand(cameraViewHandle, takePictureCommandId, []);
    }
  }

  flip() {
    if (this.cameraRef.current) {
      const flipCommandId = UIManager.getViewManagerConfig(nativeCameraViewName).Commands.flip;
      const cameraViewHandle = findNodeHandle(this.cameraRef.current);
      UIManager.dispatchViewManagerCommand(cameraViewHandle, flipCommandId, []);
    }
  }

  /** @internal */
  render() {
    const {
      facing,
      hideCaptureButton,
      hideFlipButton,
      onFrame,
      targetResolution,
      ...otherProps
    } = this.props;
    return /*#__PURE__*/React.createElement(PyTorchCoreCameraView, _extends({}, otherProps, {
      facing: facing,
      hideCaptureButton: hideCaptureButton,
      hideFlipButton: hideFlipButton,
      onCapture: this.handleOnCapture,
      onFrame: onFrame != null ? this.handleOnFrame : undefined,
      ref: this.cameraRef,
      targetResolution: targetResolution
    }));
  }

}
//# sourceMappingURL=CameraView.js.map