"use strict";

//=====Check HTTPS=====
if (location.protocol !== "https:") {
    location.href = "https:" + location.href.substring(location.protocol.length);
    throw new Error("Not HTTPS");
}

//=====Client=====
/**
 * Hide wait screen and show a message.
 * @function
 * @param {string} title - The title.
 * @param {string} msg - The message.
 */
const msg = (title, msg) => {
    $("#modal-wait-screen").modal("hide");
    $("body").css("padding-right", "0px");
    $("#modal-msg-title").text(title);
    $("#modal-msg-body").text(msg);
    $("#modal-msg").modal("show");
};
//Window resize event
$(window).resize(() => {
    $("#modal-msg-pre-body").css("max-height", Math.max($(window).height() - 240, 100));
}).trigger("resize");
//Send button click event
$("#div-main-btn-send").click(() => {
    //Show wait screen
    $("#modal-wait-screen").modal("show");
    //Send message to server
    $.post("API.php", {
        cmd: "send",
        reference: $("#div-main-input-reference").val(),
        message: $("#div-main-input-message").val(),
    }).done((data) => {
        //Check result
        if (data === "ok") {
            //Clear message box
            $("#div-main-input-reference").val("");
            $("#div-main-input-message").val("");
            msg("Message Sent", "Your message is sent.");
        } else {
            msg("Error", data);
        }
    }).fail(() => {
        msg("Connection Error", "Please try again later.");
    });
});

//=====Administrator=====
/**
 * The administration key.
 * @const {string}
 */
const adminKey = localStorage.getItem("PrivateMessageAdminKey");
/**
 * Whether the admin panel is activated.
 * @var {boolean}
 */
let activated = false;
/**
 * The current page.
 * @var {integer}
 */
let currentPage = 0;
/**
 * The ID and row element of the message that is being viewed.
 * @var {integer}
 * @var {TableRowElement}
 */
let viewID, viewRowElem;
/**
 * Draw pagination.
 * @function
 * @param {integer} total - Total page count.
 */
const paginate = (() => {
    let currentTotal = -1;
    return (total) => {
        //Check if I need to redraw pagination
        if (total !== currentTotal) {
            currentTotal = total;
            //Redraw pagination
            $("#div-admin-pagination").empty();
            for (let i = 0; i < total; i++) {
                //Create inner elements
                const linkElem = $(`<a>`).text((i).toString()).addClass("div-admin-pagination-a").data("index", i);
                const liElem = $("<li>").append(linkElem);
                //Set active state
                currentPage = Math.min(currentPage, total - 1);
                if (i === currentPage) {
                    liElem.addClass("active");
                }
                //Put into container
                $("#div-admin-pagination").append(liElem);
            }
            //Bind event handler
            $(".div-admin-pagination-a").click(function () {
                $(this).parent().addClass("active").siblings().removeClass("active");
                loadPage($(this).data("index"));
            });
        }
    };
})();
/**
 * Load a page of messages. There can be up to 20 messages per page.
 * @function
 * @param {integer} page - The page to load.
 */
const loadPage = (page) => {
    //Load messages count from server
    $("#modal-wait-screen").modal("show");
    $.post("API.php", {
        cmd: "admin get page",
        adminKey: adminKey,
        page: page,
    }).done((data) => {
        currentPage = page;
        //Update page
        let messages;
        try {
            messages = JSON.parse(data);
        } catch (err) {
            msg("Error", "Could not parse response. \n" + err.message);
            //Abort
            return;
        }
        //Draw page
        $("#div-admin-tbody").empty();
        //messages is an array of arrays, each element has this structure: [ID, IP, reference, message]
        for (let i = 0; i < messages.length; i++) {
            //Process data
            let reference = messages[i][2];
            (reference.length > 50) && (reference = reference.substr(0, 47) + "...");
            let message = messages[i][3];
            (message.length > 150) && (message = message.substr(0, 147) + "...");
            //Add to table
            $("<tr>").append(
                $("<td>").text(messages[i][1]),
                $("<td>").text(reference),
                $("<td>").text(message),
                $("<td>").append(
                    $(`<button type="button" class="btn btn-primary div-admin-tbody-btn-view">View</button>`)
                        .data("index", i)
                        .data("id", messages[i][0]),
                ),
            ).appendTo("#div-admin-tbody");
        }
        //Bind event handlers
        $(".div-admin-tbody-btn-view").click(function () {
            //Update global variables
            viewID = $(this).data("id");
            viewRowElem = $(this).parent().parent();
            //Show message
            const index = $(this).data("index");
            $("#modal-view-body").text(`Reference: ${messages[index][2]}\n\nMessage: ${messages[index][3]}`);
            $("#modal-view").modal("show");
        });
        //Hide wait screen
        $("#modal-wait-screen").modal("hide");
    }).fail(() => {
        msg("Connection Error", "Please try again later.");
    });
};
//Admin/Refresh button click event
$("#btn-admin-refresh").click(() => {
    //First time click initialization
    if (!activated) {
        //Show admin panel
        $("#div-admin").show();
        //Update the button
        $("#btn-admin-refresh").empty().append(
            $("<span>").addClass("glyphicon glyphicon-refresh"),
            " Refresh",
        ).removeClass("btn-danger").addClass("btn-info");
        $("#btn-clear-timeout").show();
        //Flip the flag
        activated = true;
    }
    //Update page count
    $("#modal-wait-screen").modal("show");
    $.post("API.php", {
        cmd: "admin count",
        adminKey: adminKey,
    }).done((data) => {
        const messageCount = parseInt(data);
        if (!isNaN(messageCount) && isFinite(messageCount) && messageCount >= 0) {
            //Update pagination
            paginate(Math.max(Math.ceil(messageCount / 20), 1));
            //Load active page
            loadPage(currentPage);
        } else {
            //Assume data to be an error message
            msg("Error", data);
        }
    }).fail(() => {
        msg("Connection Error", "Please try again later.");
    });
});
//Clear timeout button click event
$("#btn-clear-timeout").click(() => {
    //Ask server to clear timeout
    $("#modal-wait-screen").modal("show");
    $.post("API.php", {
        cmd: "admin clear timeout",
        adminKey: adminKey,
    }).done((data) => {
        if (data === "ok") {
            msg("Timeout Cleared", "Timeout for all users are cleared.");
        } else {
            msg("Error", data);
        }
    }).fail(() => {
        msg("Connection Error", "Please try again later.");
    });
});
//Delete button click event
$("#modal-view-btn-delete").click(() => {
    //Ask server to delete message
    $("#modal-wait-screen").modal("show");
    $.post("API.php", {
        cmd: "admin delete",
        adminKey: adminKey,
        id: viewID,
    }).done((data) => {
        if (data === "ok") {
            viewRowElem.remove();
            msg("Message Deleted", "The message is deleted.");
        } else {
            msg("Error", data);
        }
    }).fail(() => {
        msg("Connection Error", "Please try again later.");
    });
});
