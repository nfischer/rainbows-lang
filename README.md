# Rainbows :rainbow:
A prototype of the Rainbows programming language

<b>*Because coding should be as easy as coloring in the lines, and code should be
as easy to read as a coloring book*</b> :art:

To learn about the motivation, check out the original [one page design
doc](doc/OnePager3v2.pdf).

Try out the [online live coding
environment](https://nfischer.github.io/rainbows-lang/ ) and let me know what you
think!

## Browser Compatibility

I'm taking advantage of [css
variables](https://developers.google.com/web/updates/2016/02/css-variables-why-should-you-care?hl=en)
to make life a bit easier, so your browser will need to support these. This
should be fine for Chrome v49+, Firefox 29+, and Safari 9.1+.

If this project is not compatible with these browsers, please let me know. If
you want to run the dev unit tests, you'll need NodeJS v6+.

## Language features

 - Types are specified by color
 - JavaScript-inspired syntax
 - Type inference
 - Stricter typing than in Javascript
 - Type hints for function APIs (a colorful underline serves to remind what type
   the function will implicitly cast your values to)

## [Live coding environment](https://nfischer.github.io/rainbows-lang/)

 - Quickly cast things to a different type just by using the color slider
 - Customize the color scheme by picking new colors for each type
 - Type hints pop up when hovering over any identifier or literal
 - Type errors display at the bottom of the editor

Also, check out the [official vim
plugin](https://github.com/nfischer/vim-rainbows)!

## Soon to come

 - A CLI type inferencer and interpreter (so you can run real scripts!)
 - The ability to hook into npm modules
 - Adjustable color schemes (as a language feature!)
 - Alternatives for colorblindness and accessibility
 - Object orientation and custom types
 - A Vim filetype plugin to help you develop using Rainbows
 - Types for expressions will be shown by highlighting the surrounding brackets
   in the appropriate color

## Contributing (help is appreciated!)

The best way you can contribute right now is to help think of scenarios where
Rainbows shines! If you have a short code snippet you think Rainbows would help
make more readable, feel free to suggest it an issue or send a PR against [the
examples list](src/rb-examples.js).
