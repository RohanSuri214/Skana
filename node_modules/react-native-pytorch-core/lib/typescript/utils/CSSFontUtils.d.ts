/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @hidden
 */
declare type CSSFont = {
    fontFamily: string[];
    fontStyle?: string;
    fontSize?: string;
    fontVariant?: string;
    fontWeight?: string;
    fontStretch?: string;
    lineHeight?: string;
};
/**
 * Parses a string into a [[CSSFont]] or returns null if it fails.
 *
 * @param input CSS string as input.
 * @return The parsed [[CSSFont]] or null.
 */
export declare function parse(input: string): CSSFont | null;
export {};
