# PhiZero project page

Static project page for:

> **PhiZero: A World Model Built Around Physical Language**

The page presents the paper overview, method, results, physical-generation demos,
interactive worlds, action-conditioned control, and zero-shot motion transfer.

## Preview locally

From this directory:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Structure

```text
index.html                  # project page
en/index.html               # legacy redirect to the root page
config.js                   # public ArXiv / GitHub URLs
PhiZero.pdf                 # paper
assets/
  css/styles.css
  js/main.js
  img/phizero/              # paper figures and logo
  videos/phizero/           # curated demos from /Users/bytedance/Desktop/demo
```

## Public site

<https://Phi-Zero.github.io/>

## Release links

ArXiv remains marked `Soon`; the Code button links to the public placeholder repository:

```js
window.PHIZERO_CONFIG = {
  ARXIV_URL: "https://arxiv.org/abs/...",
  GITHUB_URL: "https://github.com/yaoyao-jpg/PhiZero",
  YEAR: "2026"
};
```

The site has no build step or package dependencies.
