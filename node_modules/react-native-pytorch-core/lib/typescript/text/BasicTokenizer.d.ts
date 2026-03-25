/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
export declare type BasicTokenizerConfig = {
    lowercase?: boolean;
    neverSplit?: string[];
};
export declare class BasicTokenizer {
    private lowercase;
    private neverSplit;
    private punctuations;
    /**
     * Construct a BasicTokenizer Object.
     *
     * @param config A basic tokenizer configuration object that specifies the non-splitable symbol, lowercase, customized punctuations, etc.
     */
    constructor({ lowercase, neverSplit }: BasicTokenizerConfig);
    /**
     * Tokenize any text with basic operations like lowercase transform, blackspace trimming and punctuation splitting.
     * Normally used to clean text before passing to other tokenizers (e.g. wordpiece).
     *
     * @param text The text to be processed
     */
    tokenize(text: string): string[];
}
