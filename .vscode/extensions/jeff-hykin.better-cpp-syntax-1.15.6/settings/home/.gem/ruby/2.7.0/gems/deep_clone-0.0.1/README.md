# DeepClone

![alt tag](http://i.qkme.me/356wcq.jpg)

## Installation

Add this line to your application's Gemfile:

    gem 'deep_clone'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install deep_clone

## Usage

    require 'deep_clone'

    {a: 1, b: 2, c: {d: 3}, e: [100, 101, 102]}.__deep_clone__

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
