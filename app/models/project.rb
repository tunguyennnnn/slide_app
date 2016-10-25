class Project < ActiveRecord::Base
  has_many :slides, dependent: :destroy
  belongs_to :user

  after_create :create_first_slide


  private
    def create_first_slide
      self.slides.create(position: 1, slide_css: Slide.DEFAULT_SLIDE_CSS)
    end
end
