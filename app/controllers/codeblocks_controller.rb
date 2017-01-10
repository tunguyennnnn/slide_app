class CodeblocksController < ApplicationController
  def new
    @new_block = CodeBlock.create(slide_id: params["slide_id"].to_i)
    respond_to do |format|
      format.json { render json: @new_block}
    end
  end

  def update
    @code_block = CodeBlock.find(params["id"])
    if params["update_data"]
      css = nil
      if params["update_data"]["css"]
        css = JSON.parse(@code_block.block_css)
        params["update_data"]["css"].each do |key, value|
          css[key] = value
        end
      end

      html = params["update_data"]["html"]
      if html && css
        @code_block.update(block_css: css.to_json, html_content: html)
      elsif html
        @code_block.update(html_content: html)
      elsif css
        @code_block.update(block_css: css.to_json)
      end
    end
    render json: true
  end

  def destroy
    if CodeBlock.destroy(params["id"])
      render json: true
    else
      render json: false
    end
  end
end
