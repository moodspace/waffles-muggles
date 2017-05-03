#
# app/controllers/map_editor_controller.rb
#
# Controller to render map editor
#
# Copyright (c) 2017 Ke Qian
#

class MapEditorController < ApplicationController
  layout 'materialize'

  def show
    @callno = params[:callno]
    @libid = params[:library_id]
    render 'map_editor/full'
  end
end
