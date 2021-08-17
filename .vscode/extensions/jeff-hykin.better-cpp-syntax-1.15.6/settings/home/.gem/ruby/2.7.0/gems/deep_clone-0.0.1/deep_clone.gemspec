# -*- encoding: utf-8 -*-
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'deep_clone/version'

Gem::Specification.new do |gem|
  gem.name          = "deep_clone"
  gem.version       = DeepClone::VERSION
  gem.authors       = ["Sergey Gaychuk"]
  gem.email         = ["sergey.gaychuk@gmail.com"]
  gem.description   = %q{Extends base classes for deep copy}
  gem.summary       = %q{Extends base classes for deep copy}
  gem.homepage      = "https://github.com/sergeygaychuk/deep_clone"

  gem.files         = `git ls-files`.split($/)
  gem.executables   = gem.files.grep(%r{^bin/}) { |f| File.basename(f) }
  gem.test_files    = gem.files.grep(%r{^(test|spec|features)/})
  gem.require_paths = ["lib"]
end
