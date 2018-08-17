const isVowel = (char: string) => /^[aeiou]$/i.test(char);
export default function pluralize(word: string) {
  if (word.length < 1) return word;
  switch (word[word.length - 1].toLowerCase()) {
    case "s":
    case "h":
    case "x":
      return word + "es";
    case "y":
      return !isVowel(word[word.length - 2])
        ? word.substring(0, word.length - 1) + "ies"
        : word + "s";
    default:
      return word + "s";
  }
}
