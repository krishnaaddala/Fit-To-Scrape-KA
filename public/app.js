$(document).on("load", function(){
    $("#onload-msg").append("<h2>" + "Uh-Oh Looks like we don't have any new quotes." + "</h2>");
})

$('#showModal').click(function(){
    // show Modal
    $.get('/scrape').done(function(data) {
                $(".myModal").modal('show');
    });
    
});
// });
  // Whenever someone clicks a p tag
  $(document).on("click", "p", function() {
    // Empty the notes from the note section
    $("#notes").empty();
    // Save the id from the p tag
    var thisId = $(this).attr("data-id");
  
    // Now make an ajax call for the Article
    $.ajax({
      method: "GET",
      url: "/quotes/" + thisId
    })
      // With that done, add the note information to the page
      .then(function(data) {
        console.log(data);
        // The title of the article
        $("#notes").append("<h2>" + data.title + "</h2>");
        // An input to enter a new title
        $("#notes").append("<input id='titleinput' name='title' >");
        // A textarea to add a new note body
        $("#notes").append("<textarea id='bodyinput' name='body'></textarea>");
        // A button to submit a new note, with the id of the article saved to it
        $("#notes").append("<button data-id='" + data._id + "' id='savenote'>Save Note</button>");
  
        // If there's a note in the article
        if (data.note) {
          // Place the title of the note in the title input
          $("#titleinput").val(data.note.title);
          // Place the body of the note in the body textarea
          $("#bodyinput").val(data.note.body);
        }
      });
  });


  $(document).on("click", "#saveMyQuote", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
  
    // Run a POST request to save the quote, using what's entered in the inputs
    $.ajax({
      method: "PUT",
      url: "/quotes/" + thisId
    })
      // With that done
      .then(function(data) {
        // Log the response
        console.log(JSON.stringify(data));
      });
  });

  $(document).on("click", "#delete-quote", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
  
    // Run a POST request to save the quote, using what's entered in the inputs
    $.ajax({
      method: "DELETE",
      url: "/quotes/" + thisId
    })
      // With that done
      .then(function(data) {
        // Log the response
        window.location.reload();     
     });
  });

  $(document).on("click", "#createMyNote", function() {
        var thisId = $(this).attr("data-id");

    $.ajax({
      method: "GET",
      url: "/quotes"
    })
      // With that done, add the note information to the page
      .then(function(data) {
        console.log(data);
        $("#modalNote").modal("show")
      });

    

  });
  
  // When you click the savenote button
  $(document).on("click", "#saveThisNote", function() {
    // Grab the id associated with the article from the submit button
    var thisId = $(this).attr("data-id");
    var noteBody = $("#noteBody").val()
    console.log(noteBody)
    console.log("id"+thisId);
    // Run a POST request to change the note, using what's entered in the inputs
    console.log()
    $.ajax({
      method: "POST",
      url: "/quotes/add-note/" + thisId,
      data: {
        // Value taken from note textarea
        body: $("#noteBody").val(),
        quoteId: thisId
      }

    })
      // With that done
      .then(function(data) {
        // Log the response
        console.log(data);
        // window.location.reload();     
        // Empty the notes section
        // $("#notes").empty();
      });
  
    // Also, remove the values entered in the input and textarea for note entry
    $("#titleinput").val("");
    $("#bodyinput").val("");
  });
  