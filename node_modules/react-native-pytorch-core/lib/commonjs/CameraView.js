"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Camera = exports.CameraFacing = void 0;

var React = _interopRequireWildcard(require("react"));

var _reactNative = require("react-native");

var _ImageModule = require("./ImageModule");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Direction the camera faces relative to the device's screen.
 */
let CameraFacing;
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

exports.CameraFacing = CameraFacing;

(function (CameraFacing) {
  CameraFacing["BACK"] = "back";
  CameraFacing["FRONT"] = "front";
})(CameraFacing || (exports.CameraFacing = CameraFacing = {}));

const nativeCameraViewName = 'PyTorchCoreCameraView';
const PyTorchCoreCameraView = (0, _reactNative.requireNativeComponent)(nativeCameraViewName);
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

class Camera extends React.PureComponent {
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
      const image = (0, _ImageModule.wrapRef)(ref);
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
      const image = (0, _ImageModule.wrapRef)(ref);
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
      const takePictureCommandId = _reactNative.UIManager.getViewManagerConfig(nativeCameraViewName).Commands.takePicture;

      const cameraViewHandle = (0, _reactNative.findNodeHandle)(this.cameraRef.current);

      _reactNative.UIManager.dispatchViewManagerCommand(cameraViewHandle, takePictureCommandId, []);
    }
  }

  flip() {
    if (this.cameraRef.current) {
      const flipCommandId = _reactNative.UIManager.getViewManagerConfig(nativeCameraViewName).Commands.flip;

      const cameraViewHandle = (0, _reactNative.findNodeHandle)(this.cameraRef.current);

      _reactNative.UIManager.dispatchViewManagerCommand(cameraViewHandle, flipCommandId, []);
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

exports.Camera = Camera;
//# sourceMappingURL=CameraView.js.map