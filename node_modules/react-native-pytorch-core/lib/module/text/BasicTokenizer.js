function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */
export class BasicTokenizer {
  /**
   * Construct a BasicTokenizer Object.
   *
   * @param config A basic tokenizer configuration object that specifies the non-splitable symbol, lowercase, customized punctuations, etc.
   */
  constructor({
    lowercase = true,
    neverSplit = []
  }) {
    _defineProperty(this, "lowercase", void 0);

    _defineProperty(this, "neverSplit", void 0);

    _defineProperty(this, "punctuations", void 0);

    this.neverSplit = new Set(neverSplit);
    this.lowercase = lowercase;
    this.punctuations = new Set(['!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '_', '`', '{', '|', '}', '~']);
  }
  /**
   * Tokenize any text with basic operations like lowercase transform, blackspace trimming and punctuation splitting.
   * Normally used to clean text before passing to other tokenizers (e.g. wordpiece).
   *
   * @param text The text to be processed
   */


  tokenize(text) {
    const tokens = [];
    const words = text.split(/\s+/);
    words.forEach(word => {
      if (this.neverSplit.has(word)) {
        tokens.push(word);
        return;
      }

      if (this.lowercase) {
        word = word.toLowerCase();
      }

      let i = 0;

      while (i < word.length) {
        if (this.punctuations.has(word[i])) {
          tokens.push(word[i]);
          i += 1;
        } else {
          let j = i + 1;

          while (j < word.length && !this.punctuations.has(word[j])) {
            j += 1;
          }

          tokens.push(word.slice(i, j));
          i = j;
        }
      }
    });
    return tokens;
  }

}
//# sourceMappingURL=BasicTokenizer.js.map