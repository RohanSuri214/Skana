/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
export declare type WordPieceTokenizerConfig = {
    vocab: string;
    unknownToken?: string;
    neverSplit?: string[];
    lowercase?: boolean;
};
export declare class WordPieceTokenizer {
    private tokenIdMap;
    private idTokenMap;
    private unknownToken;
    private unknownTokenId;
    private neverSplit;
    private lowercase;
    private basicTokenizer;
    /**
     * Construct a tokenizer with a WordPieceTokenizer object.
     *
     * @param config a tokenizer configuration object that specify the vocabulary and special tokens, etc.
     */
    constructor({ vocab, unknownToken, neverSplit, lowercase, }: WordPieceTokenizerConfig);
    private loadVocabFromString;
    /**
     * Tokenizes a piece of text into its word pieces.
     * This uses a greedy longest-match-first algorithm to perform tokenization using the given vocabulary.
     *
     * @param text the raw input of the model
     * @returns an array of tokens in vocabulary representing the input text.
     */
    tokenize(text: string): string[];
    private tokenToId;
    private idToToken;
    /**
     * Encode the raw input to a NLP model to an array of number, which is tensorizable.
     *
     * @param text The raw input of the model
     * @returns An array of number, which can then be used to create a tensor as model input with the torch.tensor API
     */
    encode(text: string): number[];
    /**
     * Decode an array of tokenIds to a string using the vocabulary
     *
     * @param tokenIds an array of tokenIds derived from the output of model
     * @returns a string decoded from the output of the model
     */
    decode(tokenIds: number[]): string;
}
