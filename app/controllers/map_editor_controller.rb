# waffles-muggles
#
# CS 5150 Navigation in Library Stacks.
#
# Controller to render maps
#
class MapEditorController < ApplicationController
  layout 'materialize'

  def show
    @callno = params[:callno]
    @libid = params[:library_id]
    render 'map_editor/full'
  end
end
