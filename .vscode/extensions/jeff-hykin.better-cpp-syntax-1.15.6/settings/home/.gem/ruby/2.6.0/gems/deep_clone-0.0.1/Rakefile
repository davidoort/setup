require "bundler"
Bundler.setup

require "rake"
require "rspec"
require "rspec/core/rake_task"

$LOAD_PATH.unshift File.expand_path("../lib", __FILE__)
require "deep_clone/version"

task :gem => :build
task :build do
  system "gem build deep_clone.gemspec"
end

task :install => :build do
  system "gem install deep_clone-#{DeepClone::VERSION}.gem"
end

task :release => :build do
  system "git tag -a v#{DeepClone::VERSION} -m 'Tagging #{DeepClone::VERSION}'"
  system "git push --tags"
  system "gem push deep_clone-#{DeepClone::VERSION}.gem"
  system "rm deep_clone-#{DeepClone::VERSION}.gem"
end

RSpec::Core::RakeTask.new("spec") do |spec|
  spec.pattern = "spec/**/*_spec.rb"
  spec.rspec_opts = %w(--format documentation --colour)
end

task :default => :spec
