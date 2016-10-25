class SlidesController < ApplicationController

  def update
    @slide = Slide.find(params['id'])
    @slide.slide_css = params[:css].to_s
    @slide.save
    respond_to do |format|
      format.json { render json: true}
    end
  end
end
