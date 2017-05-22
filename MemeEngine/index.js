"use strict";

//=====Variables=====
/**
 * The key.
 * @const {string}
 */
const key = localStorage.getItem("MemeEngineKey");
/**
 * The preview canvas and its 2d context.
 * @const {CanvasElement}
 * @const {Canbas2DContext}
 */
const previewCanvas = document.getElementById("modal-upload-preview");
const previewContext = previewCanvas.getContext("2d");
/**
 * Memes array and the index of the meme that is shown in view/edit modal.
 * Each meme is an object with these properties: id, keywords, isOffensive.
 * @var {Array.<Object>}
 * @var {integer}
 */
let memes = [], currentMeme = null;
/**
 * The current page, starts at 0. There can be 20 memes per page.
 * @var {integer}
 */
let currentPage = 0;
/**
 * The pasted image.
 * @var {Blob}
 */
let imgBlob = null;

//=====Meme Controller=====
/**
 * Redraw pagination, the container is expected to be empty.
 * @function
 */
const paginate = function () {
    //Calculate total pages
    const pageCount = Math.ceil(memes.length / 20);
    //Draw pagination
    for (let i = 0; i < pageCount; i++) {
        //Create inner elements
        const linkElem = $("<a>").text((i).toString()).addClass("div-result-pagination-a").data("index", i);
        const liElem = $("<li>").append(linkElem);
        //Set active state
        if (i === currentPage) {
            liElem.addClass("active");
        }
        //Put into container
        $("#div-result-pagination").append(liElem);
    }
    //Bind click event handler
    $(".div-result-pagination-a").click(function () {
        drawPage($(this).data("index"));
    });
};
/**
 * Draw a page of memes.
 * @function
 * @param {integer} page - The page to draw.
 */
const drawPage = function (page) {
    //Clear containers
    $("#div-result-container, #div-result-pagination").empty();
    //Ignore if there is no meme
    if (!memes.length) {
        return;
    }
    //Abort current loading
    stop();
    //Get start index, automatically flip to page before if there is no meme to draw
    let startIndex = page * 20;
    while (startIndex >= memes.length) {
        page--;
        startIndex -= 20;
    }
    //Save current page and redraw pagination
    currentPage = page;
    paginate();
    //Get end index, since end index is excluded, it can be at most the length of memes array
    let endIndex = startIndex + 20;
    (endIndex > memes.length) && (endIndex = memes.length);
    //Draw each meme
    for (let i = startIndex; i < endIndex; i++) {
        $("#div-result-container").append(
            $("<img>").attr("src", `MemeData/${memes[i].id}.png`).data("index", i).addClass("img-meme").hide()
        );
    }
    //Limit size when showing in container
    $(".img-meme").on("load", (function () {
        //Initialize counters
        let loaded = 0;
        const total = endIndex - startIndex;
        //Update status
        status(`Loading memes of this page, 0/${total} done.`);
        //Return closure function
        return function () {
            //Update status
            loaded++;
            if (loaded < total) {
                status(`Loading memes of this page, ${loaded}/${total} done.`);
            } else {
                status(`Page ${currentPage} loaded, total ${memes.length} memes found.`);
            }
            //Set height depending on width to height ratio, the ratio of the image will be kept
            //The container will scroll hotizontally if a meme has very extreme ratio
            const ratio = $(this).width() / $(this).height();
            if (ratio > 6) {
                $(this).height(75);
            } else if (ratio > 3) {
                $(this).height(150);
            } else {
                $(this).height(300);
            }
            //Show the image
            $(this).show();
        }
    })());
    //Bind click event handler
    $(".img-meme").click(function () {
        viewMeme($(this).data("index"));
    });
};
/**
 * Show meme view/edit modal for meme with supplied index.
 * @function
 * @param {integer} index - The index of the meme in question.
 */
const viewMeme = function (index) {
    //Prepare modal
    $("#modal-view-input-keywords").val(memes[index].keywords);
    $("#modal-view-input-is-offensive").prop("checked", memes[index].isOffensive);
    memes[index].unSynced ? $("#modal-view-unsynced").show() : $("#modal-view-unsynced").hide();
    $("#modal-view-image-container").html($("<img>").attr("src", `MemeData/${memes[index].id}.png`));
    //Update global variable so other event handler know which meme is active
    currentMeme = index;
    //Show modal
    $("#modal-view").modal("show");
};
/**
 * Check and save changes.
 * unSynced flag will be set if there are changes.
 * @function
 */
const save = function () {
    //Check keywords
    let newKeywords = normalize($("#modal-view-input-keywords").val());
    memes[currentMeme].keywords = ((newKeywords !== memes[currentMeme].keywords) && (memes[currentMeme].unSynced = true), newKeywords);
    //Check offensive flag
    let newFlag = $("#modal-view-input-is-offensive").is(":checked");
    memes[currentMeme].isOffensive = ((newFlag !== memes[currentMeme].isOffensive) && (memes[currentMeme].unSynced = true), newFlag);
};

//=====Helper Functions=====
/**
 * Normalize string, cast everything to lower case except those between back ticks.
 * @function
 * @param {string} str - The string to normalize.
 */
const normalize = (str) => {
    //Buffer
    let newStr = "";
    //Flags
    let isBetweenQuotes = false;
    //Loop through the string and process it
    for (let i = 0; i < str.length; i++) {
        //Flip flag
        (str[i] === "`") && (isBetweenQuotes = !isBetweenQuotes);
        //Process
        newStr += (isBetweenQuotes ? str[i] : str[i].toLowerCase());
    }
    //Return result
    return newStr;
};
/**
 * Toggle current loading state.
 * @function
 */
const loading = (() => {
    //Current loading state
    let isLoading = false;
    return () => {
        //Flip flag
        isLoading = !isLoading;
        //Show or hide loading screen
        $("#modal-loading-screen").modal(isLoading ? "show" : "hide");
    };
})();
/**
 * Update status.
 * @function
 * @param {string} str - The status to show.
 * @param {boolean} isError - Whether the status should be red.
 */
const status = (str, isError) => {
    $("#p-status").text(str).css("color", (isError ? "red" : "#333"));
};

//=====Initialization=====
//---Check HTTPS---
if (location.protocol !== "https:") {
    location.href = "https:" + location.href.substring(location.protocol.length);
    throw "Not HTTPS";
}
//---Resize Handler---
//Update size of some elements when the window is resized
$(window).resize(() => {
    $("#modal-upload-preview-container, #modal-view-image-container").css("max-height", $(window).height() - 320);
    $("#modal-upload-document, #modal-view-document").css("min-width", $(window).width() - 100);
});
//Update size for the first time
$(window).trigger("resize");
//---Search Functionality---
//Search button click
$("#btn-search").click(() => {
    //Show loading screen
    loading();
    //Abort current loading
    stop();
    //Clear current results
    memes = [];
    drawPage(0);
    //Read data from DOM
    const keywords = normalize($("#input-search").val());
    const includeOffensive = $("#input-allow-offensive").is(":checked");
    //Uncheck checkbox
    $("#input-allow-offensive").prop("checked", false);
    //Load memes
    $.post("API.php", {
        "key": key,
        "cmd": "search",
        "keywords": keywords,
        "includeOffensive": includeOffensive,
    }).done((data) => {
        //Try to parse response
        try {
            memes = JSON.parse(data);
            //Update status if there is no meme
            !memes.length && status("No memes found.");
            //Draw the first page
            drawPage(0);
        } catch (err) {
            status("Could not parse memes array, response is logged into the console.", true);
            console.log(data);
        }
    }).fail(() => {
        status("Connection error, try again later.", true);
    }).always(loading);
});
//Search textbox focus, select all text
$("#input-search").focus(() => {
    $("#input-search").select();
});
//Search box enter key keyup, triggers search
$("#input-search").keyup((e) => {
    (e.keyCode === 13) && $("#btn-search").click();
});
//---Upload Functionality---
//Upload confirm button click
$("#modal-upload-btn-upload").click(() => {
    //Check if a meme is pasted
    if (!imgBlob) {
        status("No pasted meme found.", true);
        return;
    }
    //Show loading screen
    loading();
    //Read data from DOM
    const keywords = normalize($("#modal-upload-input-keywords").val());
    const isOffensive = $("#modal-upload-input-is-offensive").is(":checked");
    //Prepare and submit data
    const reader = new FileReader();
    reader.onload = function (e) {
        //Prepare form data
        const formData = new FormData();
        formData.append("key", key);
        formData.append("cmd", "upload");
        formData.append("data", e.target.result);
        formData.append("keywords", keywords);
        formData.append("isOffensive", isOffensive);
        //Upload content
        $.ajax({
            type: "POST",
            url: "API.php",
            data: formData,
            processData: false,
            contentType: false,
        }).done((data) => {
            //Check result and prepare upload modal for next upload
            if (data === "ok") {
                //Clean up
                imgBlob = null;
                $("#modal-upload-input-keywords").val("");
                $("#modal-upload-input-is-offensive").prop("checked", false);
                $("#modal-upload-preview").hide();
                status("Uploaded.");
            } else {
                status("Could not upload meme, response is logged into the console.", true);
                console.log(data);
            }
        }).fail(() => {
            status("Connection error, try again later.", true);
        }).always(loading);
    };
    reader.readAsDataURL(imgBlob);
});
//Upload textbox paste
$("#modal-upload-input-keywords").on("paste", (e) => {
    //Get clipboard item list
    const items = e.originalEvent.clipboardData.items;
    //Find meme
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") > -1) {
            //Save this image to global variable
            imgBlob = items[i].getAsFile();
            //Initialize preview
            const previewData = URL.createObjectURL(imgBlob);
            const previewMeme = new Image();
            //Set the onload handler first
            previewMeme.onload = function () {
                //Set the size of the canvas and draw the image
                previewCanvas.height = previewMeme.height;
                previewCanvas.width = previewMeme.width;
                previewContext.drawImage(previewMeme, 0, 0);
            };
            //Put in source so the image loads
            previewMeme.src = previewData;
            //Show canvas
            previewCanvas.style.display = "block";
            //Meme found, exit
            break;
        }
    }
});
//---View/Edit Functionality---
//Delete button click
$("#modal-view-btn-delete").click(() => {
    //Still save changes, in case the user changes his mind
    save();
    //Show confirm modal
    $("#modal-delete").modal("show");
});
//Delete confirm button click
$("#modal-delete-btn-confirm").unbind().click(() => {
    //Show loading screen
    loading();
    //Ask the server to delete this meme
    $.post("API.php", {
        "key": key,
        "cmd": "delete",
        "id": memes[currentMeme].id,
    }).done((data) => {
        //Check result and update screen
        if (data === "ok") {
            //Remove from array
            memes.splice(currentMeme, 1);
            //Redraw current page, this function will automatically flip to page before if that was the last meme on the page
            drawPage(currentPage);
            status("Deleted.");
        } else {
            status("Could not delete meme, response is logged into the console.", true);
            console.log(data);
        }
    }).fail(() => {
        status("Connection error, try again later.", true);
    }).always(loading);
});
//Update button click
$("#modal-view-btn-update").click(() => {
    //Show loading screen and save changes locally
    loading();
    save();
    //Ask the server to update this meme
    $.post("API.php", {
        "key": key,
        "cmd": "update",
        "id": memes[currentMeme].id,
        "keywords": memes[currentMeme].keywords,
        "isOffensive": memes[currentMeme].isOffensive,
    }).done((data) => {
        //Check result and update screen and flag
        if (data === "ok") {
            status("Updated.");
            //Set unSynced flag back to false
            memes[currentMeme].unSynced = false;
        } else {
            status("Could not update meme, response is logged into the console.", true);
            console.log(data);
            //The unSynced flag is handled by save()
        }
    }).fail(() => {
        status("Connection error, try again later.", true);
    }).always(loading);
});
//---Wrap Up---
status("Ready!");
