"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WordPieceTokenizer = void 0;

var _BasicTokenizer = require("./BasicTokenizer");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class WordPieceTokenizer {
  /**
   * Construct a tokenizer with a WordPieceTokenizer object.
   *
   * @param config a tokenizer configuration object that specify the vocabulary and special tokens, etc.
   */
  constructor({
    vocab,
    unknownToken = '[UNK]',
    neverSplit = ['[UNK]', '[SEP]', '[PAD]', '[CLS]', '[MASK]'],
    lowercase = true
  }) {
    _defineProperty(this, "tokenIdMap", new Map());

    _defineProperty(this, "idTokenMap", new Map());

    _defineProperty(this, "unknownToken", void 0);

    _defineProperty(this, "unknownTokenId", -1);

    _defineProperty(this, "neverSplit", void 0);

    _defineProperty(this, "lowercase", void 0);

    _defineProperty(this, "basicTokenizer", void 0);

    this.unknownToken = unknownToken;
    this.loadVocabFromString(vocab);
    this.lowercase = lowercase;
    this.neverSplit = [...neverSplit];
    this.basicTokenizer = new _BasicTokenizer.BasicTokenizer({
      neverSplit: this.neverSplit,
      lowercase: this.lowercase
    });
  }

  loadVocabFromString(vocab) {
    const arr = vocab.split('\n');
    arr.forEach((element, index) => {
      this.tokenIdMap.set(element, index);
      this.idTokenMap.set(index, element);
    });
    const unknownTokenId = this.tokenIdMap.get(this.unknownToken);

    if (unknownTokenId === undefined) {
      throw new Error('Illegal vocabulary: unknownToken is missing.');
    } else {
      this.unknownTokenId = unknownTokenId;
    }
  }
  /**
   * Tokenizes a piece of text into its word pieces.
   * This uses a greedy longest-match-first algorithm to perform tokenization using the given vocabulary.
   *
   * @param text the raw input of the model
   * @returns an array of tokens in vocabulary representing the input text.
   */


  tokenize(text) {
    const tokens = [];
    const words = text.split(/\s+/);
    words.forEach(word => {
      if (this.tokenIdMap.has(word)) {
        tokens.push(word);
        return;
      }

      if (this.lowercase) {
        word = word.toLowerCase();
      }

      let isBad = false;
      const subTokens = [];
      let start = 0;

      while (start < word.length) {
        let end = word.length;
        let curSubstr;

        while (start < end) {
          let substr = word.slice(start, end);

          if (start > 0) {
            substr = '##' + substr;
          }

          if (this.tokenIdMap.has(substr)) {
            curSubstr = substr;
            break;
          }

          end -= 1;
        }

        if (curSubstr === undefined) {
          isBad = true;
          break;
        }

        subTokens.push(curSubstr);
        start = end;
      }

      if (isBad) {
        tokens.push(this.unknownToken);
      } else {
        tokens.push(...subTokens);
      }
    });
    return tokens;
  }

  tokenToId(token) {
    const index = this.tokenIdMap.get(token);
    return index !== null && index !== void 0 ? index : this.unknownTokenId;
  }

  idToToken(tokenId) {
    const token = this.idTokenMap.get(tokenId);
    return token !== null && token !== void 0 ? token : this.unknownToken;
  }
  /**
   * Encode the raw input to a NLP model to an array of number, which is tensorizable.
   *
   * @param text The raw input of the model
   * @returns An array of number, which can then be used to create a tensor as model input with the torch.tensor API
   */


  encode(text) {
    text = this.basicTokenizer.tokenize(text).join(' ');
    return this.tokenize(text).map(token => this.tokenToId(token));
  }
  /**
   * Decode an array of tokenIds to a string using the vocabulary
   *
   * @param tokenIds an array of tokenIds derived from the output of model
   * @returns a string decoded from the output of the model
   */


  decode(tokenIds) {
    const texts = tokenIds.map(tokenId => this.idToToken(tokenId));
    return texts.join(' ').replace(/\s?##/g, '');
  }

}

exports.WordPieceTokenizer = WordPieceTokenizer;
//# sourceMappingURL=WordpieceTokenizer.js.map