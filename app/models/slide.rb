class Slide < ActiveRecord::Base
  belongs_to :project
  has_many :text_blocks
  has_many :code_blocks
  has_many :image_blocks, as: :image_blockable

  DEFAULT_SLIDE_CSS = {position: {top: "0px", left: "0px"}, width: "500px",
                       height: "500px", background: "white",
                       border: "0px none rgb(51, 51, 51)"}.to_json


  def css
    JSON.parse(slide_css)
  end

  def self.DEFAULT_SLIDE_CSS
    DEFAULT_SLIDE_CSS
  end
end
