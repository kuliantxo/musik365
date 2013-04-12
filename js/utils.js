//

// Lean Overlay

//

(function($){

	$.fn.extend({

		leanModal:function(options){

			var defaults={top:100,overlay:0.5,closeButton:null};

			var overlay=$("<div id='lean_overlay'></div>");

			$("body").append(overlay);

			options=$.extend(defaults,options);



			return this.each(function(){

				var o=options;

				$(this).click(function(e){

					var modal_id=$(this).attr("href");

					$("#lean_overlay").click(function(){

						close_modal(modal_id);

					});

					$(o.closeButton).click(function(){

						close_modal(modal_id);

					});

					var modal_height=$(modal_id).outerHeight();

					var modal_width=$(modal_id).outerWidth();

					$("#lean_overlay").css({"display":"block",opacity:0});

					$("#lean_overlay").fadeTo(200,o.overlay);

					$(modal_id).css({"display":"block","position":"fixed","opacity":0,"z-index":11000,"left":50+"%","margin-left":-(modal_width/2)+"px","top":o.top+"px"});

					$(modal_id).fadeTo(200,1);

					e.preventDefault()

				})

			});



			function close_modal(modal_id){

				$("#lean_overlay").fadeOut(200);

				$(modal_id).css({"display":"none"})

			}

		}

	})

})(jQuery);





//

// StripAccents

//

var StripAccents = (function () {

  var in_chrs   = 'àáâãäçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',

      out_chrs  = 'aaaaaceeeeiiiinooooouuuuyyAAAAACEEEEIIIINOOOOOUUUUY',

      chars_rgx = new RegExp('[' + in_chrs + ']', 'g'),

      transl    = {}, i,

      lookup    = function (m) { return transl[m] || m; };



  for (i=0; i<in_chrs.length; i++) {

    transl[ in_chrs[i] ] = out_chrs[i];

  }



  return function (s) { return s.replace(chars_rgx, lookup); }

})();





//

// Feedback

//

$(function() {



	$("#feedback button").click(function() {

		$('input[type="text"], textarea').removeClass();



		var name = $("input[name='name']");

		if (name.val() == "") {

			name.addClass('error');

			name.focus();

			return false;

		} else {

			name.addClass('good');

		}



		var email = $("input[name='email']");

		if (email.val() == "") {

			email.addClass('error');

			email.focus();

			return false;

		} else {

			email.addClass('good');

		}



		var comment = $("textarea[name='comment']");

		if (comment.val() == "") {

			comment.addClass('error');

			comment.focus();

			return false;

		} else {

			comment.addClass('good');

		}



		var dataString = 'name='+ name.val() + '&email=' + email.val() + '&comment=' + comment.val();



		$.ajax({

			type: "POST",

			url: "/bin/process.php",

			data: dataString,

			success: function() {

				$('#feedback .modal-body').html("<div class='modal-content'></div>");

				$('#feedback .modal-content').html("<h2>Feedback Form Submitted!</h2>")

					.append("<p>We will be in touch soon.</p>")

					.hide()

					.fadeIn(1500, function() {

						$('#feedback .modal-content').append('<img id="checkmark" src="images/checkmark.png" width="40px">');

					});

			}

		});



		return false;

	});

});





function hideShow(id, that, msg) {

	var e = document.getElementById(id);

	if (! msg) msg = {hide: 'Hide More', show: 'Show More'};



	if (e.style.display == 'block') {

		e.style.display = 'none';

		that.innerHTML = msg.show;

	} else {

		e.style.display = 'block';

		that.innerHTML = msg.hide;

	}

}

