function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
import * as React from 'react';
import { useCallback } from 'react';
import { NativeModules, processColor, requireNativeComponent } from 'react-native';
import { toPlainNativeJSRef } from './NativeJSRef';
import * as CSSFontUtils from './utils/CSSFontUtils';
const {
  PyTorchCoreCanvasRenderingContext2DModule: CanvasRenderingContext2DModule,
  PyTorchCoreImageDataModule: ImageDataModule
} = NativeModules;

/**
 * @hidden
 *
 * We use this invalid value as a workaround to simulate a nullable value. This
 * allows us to implement overloading functions in native (e.g., see
 * [[CanvasRenderingContext2D.drawImage]]).
 */
const INVALID_VALUE_NULLABLE = -1;

const wrapRef = ref => {
  let lineCap = null;
  let lineJoin = null;
  let lineWidth = null;
  let miterLimit = null;
  let textAlign = null;
  return {
    set font(value) {
      const font = CSSFontUtils.parse(value);

      if (font !== null) {
        CanvasRenderingContext2DModule.setFont(ref, font);
      }
    },

    set fillStyle(value) {
      const color = processColor(value);

      if (color == null) {
        throw new Error(`invalid color value ${value}`);
      }

      CanvasRenderingContext2DModule.setFillStyle(ref, color);
    },

    set lineCap(value) {
      if (value !== lineCap) {
        lineCap = value;
        CanvasRenderingContext2DModule.setLineCap(ref, value);
      }
    },

    set lineJoin(value) {
      if (lineJoin !== value) {
        lineJoin = value;
        CanvasRenderingContext2DModule.setLineJoin(ref, value);
      }
    },

    set lineWidth(width) {
      if (lineWidth !== width) {
        lineWidth = width;
        CanvasRenderingContext2DModule.setLineWidth(ref, width);
      }
    },

    set miterLimit(value) {
      if (miterLimit !== value) {
        miterLimit = value;
        CanvasRenderingContext2DModule.setMiterLimit(ref, value);
      }
    },

    set strokeStyle(value) {
      const color = processColor(value);

      if (color == null) {
        throw new Error(`invalid color value ${value}`);
      }

      CanvasRenderingContext2DModule.setStrokeStyle(ref, color);
    },

    set textAlign(value) {
      if (textAlign !== value) {
        textAlign = value;
        CanvasRenderingContext2DModule.setTextAlign(ref, value);
      }
    },

    arc(x, y, radius, startAngle, endAngle, anticlockwise = false) {
      CanvasRenderingContext2DModule.arc(ref, x, y, radius, startAngle, endAngle, anticlockwise);
    },

    beginPath() {
      CanvasRenderingContext2DModule.beginPath(ref);
    },

    clear() {
      CanvasRenderingContext2DModule.clear(ref);
    },

    clearRect(x, y, width, height) {
      CanvasRenderingContext2DModule.clearRect(ref, x, y, width, height);
    },

    closePath() {
      CanvasRenderingContext2DModule.closePath(ref);
    },

    drawCircle(x, y, radius) {
      CanvasRenderingContext2DModule.drawCircle(ref, x, y, radius);
    },

    drawImage(image, dx_sx, dy_sy, dWidth_sWidth = INVALID_VALUE_NULLABLE, dHeight_sHeight = INVALID_VALUE_NULLABLE, dx = INVALID_VALUE_NULLABLE, dy = INVALID_VALUE_NULLABLE, dWidth = INVALID_VALUE_NULLABLE, dHeight = INVALID_VALUE_NULLABLE) {
      // TODO(T122223365) Temporary solution to make the drawImage function
      // work with either NativeJSRef images or true native images (see
      // IImage.h).
      //
      // Without this reassignment of just the image ID, the bridge will
      // eventually throw an error because it can't serialize the the native
      // image.
      //
      // {@link https://github.com/pytorch/live/blob/main/react-native-pytorch-core/cxx/src/torchlive/media/image/IImage.h#L15}
      const imageRef = toPlainNativeJSRef(image);
      CanvasRenderingContext2DModule.drawImage(ref, imageRef, dx_sx, dy_sy, dWidth_sWidth, dHeight_sHeight, dx, dy, dWidth, dHeight);
    },

    fill() {
      CanvasRenderingContext2DModule.fill(ref);
    },

    fillCircle(x, y, radius) {
      CanvasRenderingContext2DModule.fillCircle(ref, x, y, radius);
    },

    fillRect(x, y, width, height) {
      CanvasRenderingContext2DModule.fillRect(ref, x, y, width, height);
    },

    fillText(text, x, y) {
      CanvasRenderingContext2DModule.fillText(ref, text, x, y);
    },

    async getImageData(sx, sy, sw, sh) {
      const imageDataRef = await CanvasRenderingContext2DModule.getImageData(ref, sx, sy, sw, sh);
      return { ...imageDataRef,

        get width() {
          return sw;
        },

        get height() {
          return sh;
        },

        get data() {
          // TODO(T92409860) Implement ImageData.data
          return new Uint8ClampedArray();
        },

        async release() {
          return await ImageDataModule.release(imageDataRef);
        }

      };
    },

    async invalidate() {
      return await CanvasRenderingContext2DModule.invalidate(ref);
    },

    lineTo(x, y) {
      CanvasRenderingContext2DModule.lineTo(ref, x, y);
    },

    moveTo(x, y) {
      CanvasRenderingContext2DModule.moveTo(ref, x, y);
    },

    putImageData(imageData, dx, dy) {
      CanvasRenderingContext2DModule.putImageData(ref, imageData, dx, dy);
    },

    rect(x, y, width, height) {
      CanvasRenderingContext2DModule.rect(ref, x, y, width, height);
    },

    async restore() {
      // The local values for the canvas context properties need to be reset on
      // `ctx.restore()`. If they aren't reset, the values for these properties
      // might be different native than in JavaScript and can cause issues
      // where the native functions aren't called and therefore leading to
      // different rendering outcomes on web canvas than in this native canvas
      // implementation.
      //
      // In the example below, the second red `strokeRect` should fully cover
      // the lime `strokeRect`. Without this reset, the `lineWidth` for the red
      // `strokeRect` will be  1px instead of `10px`.
      //
      // ```typescript
      // ctx.save();
      // ctx.lineWidth = 10;
      // ctx.strokeStyle = 'lime';
      // ctx.strokeRect(10, 10, 40, 40);
      // ctx.restore();
      //
      // ctx.save();
      // ctx.lineWidth = 10;
      // ctx.strokeStyle = 'red';
      // ctx.strokeRect(10, 10, 40, 40);
      // ctx.restore();
      // ctx.invalidate();
      // ```
      //
      lineCap = null;
      lineJoin = null;
      lineWidth = null;
      miterLimit = null;
      textAlign = null;
      await CanvasRenderingContext2DModule.restore(ref);
    },

    rotate(angle) {
      CanvasRenderingContext2DModule.rotate(ref, angle);
    },

    async save() {
      await CanvasRenderingContext2DModule.save(ref);
    },

    scale(x, y) {
      CanvasRenderingContext2DModule.scale(ref, x, y);
    },

    setTransform(a, b, c, d, e, f) {
      CanvasRenderingContext2DModule.setTransform(ref, a, b, c, d, e, f);
    },

    stroke() {
      CanvasRenderingContext2DModule.stroke(ref);
    },

    strokeRect(x, y, width, height) {
      CanvasRenderingContext2DModule.strokeRect(ref, x, y, width, height);
    },

    strokeText(text, x, y) {
      CanvasRenderingContext2DModule.strokeText(ref, text, x, y);
    },

    translate(x, y) {
      CanvasRenderingContext2DModule.translate(ref, x, y);
    }

  };
};

const PyTorchCoreCanvasView = requireNativeComponent('PyTorchCoreCanvasView');
/**
 * A canvas component providing drawing functions similar to `2dcontext`.
 *
 * ```typescript
 * export default function App() {
 *   const [drawingContext, setDrawingContext] = useState<
 *     CanvasRenderingContext2D
 *   >();
 *
 *   const handleContext2D = useCallback(
 *     async (ctx: CanvasRenderingContext2D) => {
 *       setDrawingContext(ctx);
 *     },
 *     [setDrawingContext],
 *   );
 *
 *   useLayoutEffect(() => {
 *     const ctx = drawingContext;
 *     if (ctx != null) {
 *       ctx.clear();
 *
 *       ctx.fillStyle = '#fb0fff';
 *       ctx.fillRect(40, 160, 64, 72);
 *       ctx.strokeStyle = '#00ffff';
 *       ctx.lineWidth = 6;
 *       ctx.strokeRect(40, 160, 64, 72);
 *
 *       ctx.invalidate();
 *     }
 *   }, [drawingContext]);
 *
 *   return (
 *     <Canvas style={StyleSheet.absoluteFill} onContext2D={handleContext2D} />
 *   );
 * }
 * ```
 *
 * @component
 */

export function Canvas({
  onContext2D,
  ...otherProps
}) {
  const handleContext2D = useCallback(event => {
    const {
      nativeEvent
    } = event;
    const {
      ID
    } = nativeEvent;
    const ref = {
      ID
    };
    const ctx = wrapRef(ref);
    onContext2D(ctx);
  }, [onContext2D]);
  return /*#__PURE__*/React.createElement(PyTorchCoreCanvasView, _extends({}, otherProps, {
    onContext2D: handleContext2D
  }));
}
//# sourceMappingURL=CanvasView.js.map