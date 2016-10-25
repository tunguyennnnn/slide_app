class TextblocksController < ApplicationController
  def new
    @new_block = TextBlock.create(slide_id: params["slide_id"].to_i)
    respond_to do |format|
      format.json { render json: @new_block}
    end
  end

  def update
    @text_block = TextBlock.find(params["id"])
    if params["update_data"]
      css = nil
      if params["update_data"]["css"]
        css = JSON.parse(@text_block.text_block_css)
        params["update_data"]["css"].each do |key, value|
          css[key] = value
        end
      end

      html = params["update_data"]["html"]
      if html && css
        @text_block.update(text_block_css: css.to_json, html_content: html)
      elsif html
        @text_block.update(html_content: html)
      elsif css
        @text_block.update(text_block_css: css.to_json)
      end
    end
    render json: true
  end

  def destroy
    if TextBlock.destroy(params["id"])
      render json: true
    else
      render json: false
    end
  end
end
