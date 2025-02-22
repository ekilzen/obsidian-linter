import {Options, RuleType} from '../rules';
import RuleBuilder, {ExampleBuilder, OptionBuilderBase} from './rule-builder';
import dedent from 'ts-dedent';
import {ignoreListOfTypes, IgnoreTypes} from '../utils/ignore-types';
import {insert} from '../utils/strings';

class FileNameHeadingOptions implements Options {
  @RuleBuilder.noSettingControl()
    fileName: string;
}

@RuleBuilder.register
export default class FileNameHeading extends RuleBuilder<FileNameHeadingOptions> {
  get OptionsClass(): new () => FileNameHeadingOptions {
    return FileNameHeadingOptions;
  }
  get name(): string {
    return 'File Name Heading';
  }
  get description(): string {
    return 'Inserts the file name as a H1 heading if no H1 heading exists.';
  }
  get type(): RuleType {
    return RuleType.HEADING;
  }
  apply(text: string, options: FileNameHeadingOptions): string {
    return ignoreListOfTypes([IgnoreTypes.code, IgnoreTypes.yaml, IgnoreTypes.link, IgnoreTypes.wikiLink, IgnoreTypes.tag], text, (text) => {
      // check if there is a H1 heading
      const hasH1 = text.match(/^#\s.*/m);
      if (hasH1) {
        return text;
      }

      const fileName = options.fileName;
      // insert H1 heading after front matter
      let yaml_end = text.indexOf('\n---');
      yaml_end =
        yaml_end == -1 || !text.startsWith('---\n') ? 0 : yaml_end + 5;
      return insert(text, yaml_end, `# ${fileName}\n`);
    });
  }
  get exampleBuilders(): ExampleBuilder<FileNameHeadingOptions>[] {
    return [
      new ExampleBuilder({
        description: 'Inserts an H1 heading',
        before: dedent`
          This is a line of text
        `,
        after: dedent`
          # File Name
          This is a line of text
        `,
        options: {
          fileName: 'File Name',
        },
      }),
      new ExampleBuilder({
        description: 'Inserts heading after YAML front matter',
        before: dedent`
          ---
          title: My Title
          ---
          This is a line of text
        `,
        after: dedent`
          ---
          title: My Title
          ---
          # File Name
          This is a line of text
        `,
        options: {
          fileName: 'File Name',
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<FileNameHeadingOptions>[] {
    return [];
  }
}
