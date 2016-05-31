# Rainbows
A prototype of the Rainbows programming language

To learn about the motivation, check out the original [one page design
doc](doc/OnePager3v2.pdf).

Feel free to try out the editor online https://nfischer.github.io/rainbows/ and
let me know what you think of the project!

An interpreter is coming soon!

## Language features

 - Types are specified by color
 - JavaScript-inspired syntax
 - Type inference
 - Type hints for function APIs (a colorful underline helps you remember what
   order everything goes in for the function call)

### Soon to come

 - Adjustable color schemes (as a language feature!)
 - Alternatives for colorblindness and accessibility
 - Object orientation and custom types
 - Tweaking the default color scheme to be more appealing
 - A Vim filetype plugin to help you develop using Rainbows

## Contributing

The best way you can contribute right now is to help think of scenarios where
Rainbows shines! If you have a short code snippet you think Rainbows would help
make more readable, feel free to suggest it an issue or send a PR against [the
examples list](src/rb-examples.js).

## Browser Compatibility

This should be compatible with Google Chrome (and eventually Firefox). If it's
not, let me know. If you want to run the dev unit tests, you'll probably need
Node v6+.
