import MarkdownIt from "markdown-it";
import highlightjs from "markdown-it-highlightjs";

const markdownIt = MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(
  // deno-lint-ignore no-explicit-any
  highlightjs as any,
).use((md) => {
  // mostly inspired by https://github.com/tylingsoft/markdown-it-task-list/blob/master/src/index.js
  const tags: Record<string, number> = {};

  const renderInlineOriginal = md.renderer.renderInline.bind(md.renderer);
  md.renderer.renderInline = (tokens, options, env) => {
    const result = renderInlineOriginal(tokens, options, env);
    const content = tokens[0]?.content;
    if (!content) return result;

    if ((tags["bullet_list"] ?? 0) > 0 && (tags["list_item"] ?? 0) > 0) {
      if (content.startsWith("[ ] ")) {
        return '<input type="checkbox" disabled /> ' + result.slice(4);
      }

      if (content.startsWith("[x] ")) {
        return '<input type="checkbox" disabled checked /> ' + result.slice(4);
      }
    }
    return result;
  };

  const renderTokenOriginal = md.renderer.renderToken.bind(md.renderer);
  md.renderer.renderToken = (tokens, idx, options) => {
    const token = tokens[idx];
    if (token) {
      const tag = token.type;
      if (tag.endsWith("_open")) {
        const _tag = tag.slice(0, tag.length - 5);
        tags[_tag] = (tags[_tag] ?? 0) + 1;
      } else if (tag.endsWith("_close")) {
        const _tag = tag.slice(0, tag.length - 6);
        tags[_tag] = (tags[_tag] ?? 0) - 1;
      }
      if (
        (tags["bullet_list"] ?? 0) > 0 && tag === "list_item_open" &&
        (tokens[idx + 2]?.content.startsWith("[ ] ") ||
          tokens[idx + 2]?.content.startsWith("[x] "))
      ) {
        token.attrPush(["class", "task-list-item"]);
      }
    }
    return renderTokenOriginal(tokens, idx, options);
  };
}).use((md) => {
  const renderLinkOpenOriginal = md.renderer.rules.link_open ||
    function (tokens, idx, options, _env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const href = tokens[idx]?.attrGet("href");
    if (/^https?:\/\//i.test(href ?? "")) {
      tokens[idx]?.attrSet("target", "_blank");
      tokens[idx]?.attrSet("rel", "noopener noreferrer");
    }
    return renderLinkOpenOriginal(tokens, idx, options, env, self);
  };
}).use((md) => {
  md.linkify.tlds([
    "app",
    "xyz",
  ], true);
});

export const renderMarkdown = (md: string): string => markdownIt.render(md);
