# Add your own tasks in files placed in lib/tasks ending in .rake,
# for example lib/tasks/capistrano.rake, and they will automatically be available to Rake.

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
