#
# Rakefile
#
# Rake tasks
#
# Copyright (c) 2017 Ke Qian
#

require_relative 'config/application'

Rails.application.load_tasks

task :clean do
  sh 'rm -r public/uploads'
  sh 'mkdir public/uploads'
  sh 'echo >> public/uploads/.keep'
  sh 'mkdir public/uploads/ref'
  sh 'echo >> public/uploads/ref/.keep'
  sh 'rm -r public/docs'
end

task :docs do
  sh 'bash lib/tasks/gen-docs.sh'
end
