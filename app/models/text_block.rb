class TextBlock < ActiveRecord::Base
  after_create :add_default_html_css
  belongs_to :slides
  has_many :image_blocks, as: :image_blockable

  DEFAULT_HTML = "<p><br></p><p><br></p><p><br></p>"
  DEFAULT_CSS = {width: "150px",
                 top: "0px", left: "0px",
                 border: "2px solid rgb(51, 51, 51)",
                 border_radius: "10px",
                 background: "white",
                 padding_bottom: "12px"}.to_json

  def add_default_html_css
    self.update(text_block_css: DEFAULT_CSS, html_content: DEFAULT_HTML)
  end
end
