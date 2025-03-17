# 🚀 Exploring GitHub-Flavored Markdown (GFM)

GitHub-Flavored Markdown (GFM) extends the standard
[Markdown](https://daringfireball.net/projects/markdown/) syntax with some
powerful features that make writing documentation, README files, and project
notes more effective. This article explores some of its key features with
examples. 🎉

## Links

Internal Links (absolute or relative paths) will not open in a new tab.

- [Home](/)

External Links (starting with `https://` or `http://`) would open in a new tab.

- [linkz](https://linkz.fishball.app/)
- [ycmjason](https://www.ycmjason.com/)

URL like links are automatically linked

- https://www.fishball.app/
- fishball.app
- yo@fishball.app

## 🎨 Syntax Highlighting

GFM allows syntax highlighting for code blocks using triple backticks
(`` ``` ``) followed by the language name.

```javascript
const greet = (name) => {
  console.log(`Hello, ${name}!`);
};

greet("GitHub");
```

---

## ✅ Task Lists

Task lists are interactive checklists useful for tracking progress.

- [x] Learn Markdown Basics
- [ ] Explore GFM Features
  - [ ] nested task
- [ ] Write a README with GFM
- [ ] Commit and Push to GitHub
  - [ ] nested task

---

## 📊 Tables

GFM supports tables for structuring data.

| Feature             | Supported? |
| ------------------- | ---------- |
| Syntax Highlighting | ✅         |
| Task Lists          | ✅         |
| Tables              | ✅         |

---

## ✍️ Text Formatting

GFM allows various text formatting options:

- **Bold text** using `**bold**` → **bold**
- _Italic text_ using `*italic*` → _italic_
- ~~Strikethrough~~ using `~~strikethrough~~`
- `Inline code` using backticks → `console.log('Hello');`

---

## 🖥 Code Blocks

Inline code: Use backticks like `console.log('Hello')`.

Multi-line code:

```python
def greet(name):
    print(f"Hello, {name}!")

greet("GitHub")
```

---

## 🗨 Block Quotes

> "Markdown is awesome!" – Everyone

---

## 🎯 Conclusion

GitHub-Flavored Markdown enhances the standard Markdown syntax with extra
features, making it a powerful tool for developers, technical writers, and
documentation enthusiasts. Give it a try in your next project! 🚀
