# PhiZero project page

Static project page for:

> **PhiZero: Learning Physical Video World Model from In-the-wild Videos**

The page presents the paper overview, method, results, physical-generation demos,
interactive worlds, action-conditioned control, and zero-shot motion transfer.

## Preview locally

From this directory:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>. The root page redirects to `/en/`.

## Structure

```text
index.html                  # root redirect
en/index.html               # project page
config.js                   # public ArXiv / GitHub URLs
PhiZero.pdf                 # paper
assets/
  css/styles.css
  js/main.js
  img/phizero/              # paper figures and logo
  videos/phizero/           # curated demos from /Users/bytedance/Desktop/demo
```

## Public links

ArXiv and GitHub buttons intentionally show `Soon` until public URLs are added:

```js
window.PHIZERO_CONFIG = {
  ARXIV_URL: "https://arxiv.org/abs/...",
  GITHUB_URL: "https://github.com/...",
  YEAR: "2026"
};
```

The site has no build step or package dependencies.
