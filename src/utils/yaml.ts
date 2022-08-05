import {load, dump} from 'js-yaml';
import {escapeDollarSigns, yamlRegex} from './regex';

/**
 * Adds an empty YAML block to the text if it doesn't already have one.
 * @param {string} text - The text to process
 * @return {string} The processed text with an YAML block
 */
export function initYAML(text: string): string {
  if (text.match(yamlRegex) === null) {
    text = '---\n---\n' + text;
  }
  return text;
}

export function formatYAML(text: string, func: (text: string) => string): string {
  if (!text.match(yamlRegex)) {
    return text;
  }

  const oldYaml = text.match(yamlRegex)[0];
  const newYaml = func(oldYaml);
  text = text.replace(oldYaml, escapeDollarSigns(newYaml));

  return text;
}

export function toYamlString(obj: any): string {
  return dump(obj, {lineWidth: -1}).slice(0, -1);
}

export function toSingleLineArrayYamlString<T>(arr: T[]): string {
  return dump(arr, {flowLevel: 0}).slice(0, -1);
}

function getYamlSectionRegExp(rawKey: string): RegExp {
  return new RegExp(`(?<=^|\\n)${rawKey}:[ \\t]*(\\S.*|(?:\\n {2}\\S.*)*)\\n`);
}

export function setYamlSection(yaml: string, rawKey: string, rawValue: string): string {
  const yamlSectionEscaped = `${rawKey}:${rawValue}\n`;
  let isReplaced = false;
  let result = yaml.replace(getYamlSectionRegExp(rawKey), () => {
    isReplaced = true;
    return yamlSectionEscaped;
  });
  if (!isReplaced) {
    result = `${yaml}${yamlSectionEscaped}`;
  }
  return result;
}

export function getYamlSectionValue(yaml: string, rawKey: string): string | null {
  const match = yaml.match(getYamlSectionRegExp(rawKey));
  const result = match == null ? null : match[1];
  return result;
}

export function removeYamlSection(yaml: string, rawKey: string): string {
  const result = yaml.replace(getYamlSectionRegExp(rawKey), '');
  return result;
}

export function loadYAML(yaml_text: string): any {
  if (yaml_text == null) {
    return null;
  }

  // replacing tabs at the beginning of new lines with 2 spaces fixes loading yaml that has tabs at the start of a line
  // https://github.com/platers/obsidian-linter/issues/157
  const parsed_yaml = load(yaml_text.replace(/\n(\t)+/g, '\n  ')) as {};
  if (parsed_yaml == null) {
    return {};
  }

  return parsed_yaml;
}

export type TagSpecificYamlArrayFormats = 'single string space delimited' | 'single-line space delimited';

export type SpecialYamlArrayFormats = 'single string to single-line' | 'single string to multi-line' | 'single string comma delimited';

export type NormalYamlArrayFormats = 'single-line' | 'multi-line';

export function formatYamlArrayValue(value: string | string[], format: NormalYamlArrayFormats | SpecialYamlArrayFormats | TagSpecificYamlArrayFormats): string {
  if (typeof value === 'string') {
    value = [value];
  }

  switch (format) {
    case 'single-line':
      if (value == null || value.length === 0) {
        return ' []';
      }

      return ' ' + toSingleLineArrayYamlString(value);
    case 'multi-line':
      if (value == null || value.length === 0) {
        return '\n  - ';
      }
      return '\n  - ' + value.join('\n  - ');
    case 'single string to single-line':
      if (value == null || value.length === 0) {
        return ' ';
      } else if (value.length === 1) {
        return ' ' + value[0];
      }

      return ' ' + toSingleLineArrayYamlString(value);
    case 'single string to multi-line':
      if (value == null || value.length === 0) {
        return ' ';
      } else if (value.length === 1) {
        return ' ' + value[0];
      }

      return '\n  - ' + value.join('\n  - ');
    case 'single string space delimited':
      if (value == null || value.length === 0) {
        return ' ';
      } else if (value.length === 1) {
        return ' ' + value[0];
      }

      return ' ' +value.join(' ');
    case 'single string comma delimited':
      if (value == null || value.length === 0) {
        return ' ';
      } else if (value.length === 1) {
        return ' ' + value[0];
      }

      return ' ' + value.join(', ');
    case 'single-line space delimited':
      if (value == null || value.length === 0) {
        return ' []';
      } else if (value.length === 1) {
        return ' ' + value[0];
      }

      return ' ' + toSingleLineArrayYamlString(value).replaceAll(', ', ' ');
  }
}

export function convertTagValueToStringOrStringArray(value: string | string[]): string[] {
  if (typeof value === 'string') {
    if (value.includes(',')) {
      return value.split(', ');
    }

    return value.split(' ');
  }

  return value;
}

export function convertAliasValueToStringOrStringArray(value: string | string[]): string[] {
  if (typeof value === 'string') {
    return value.split(', ');
  }

  return value;
}
