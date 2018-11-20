
I hate bookkeeping. So I wanted to create a tool to rename my scanned invoices,
by prefixing the date found in the document.


```
Usage: rename-hero -f [files]

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  -f, --file    Load a file                                   [array] [required]
  --dateformat  Format the date should be parsed in        [default: "yyyymmdd"]
  --future      Also consider dates in the future               [default: false]
  --dry         Do not rename any file                          [default: false]

Rename file based on best date guess.
```

# Dependencies

```
brew install tesseract imagemagick ghostscript poppler xpdf
```

# To-Do

- Tests & sane packaging
- NPM support
- Remove duplicate options
- Remove options that are derived by time only
- Order options by likelihood (recent past, assume file creation date is more recent, ..)
- Option to select most likely date
