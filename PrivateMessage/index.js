"use strict";

//=====Client=====
/**
 * Hide wait screen and show a message.
 * @function
 * @param {string} title - The title.
 * @param {string} msg - The message.
 */
const msg = function (title, msg) {
    $("#modal-wait-screen").modal("hide");
    $("#modal-msg-title").text(title);
    $("#modal-msg-body").text(msg);
    $("#modal-msg").modal("show");
};
//Window resize event
$(window).resize(() => {
    $("#modal-msg-pre-body").css("max-height", $(window).height() - 240);
});
//Set size for the first time
$(window).trigger("resize");
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
 * Load a page of messages. There can be up to 20 messages per page.
 * @function
 * @param {integer} page - The page to load.
 */
const loadPage = function (page) {
    //Load messages count from server
    $("#modal-wait-screen").modal("show");
    $.post("API.php", {
        cmd: "admin count",
        adminKey: adminKey,
        page: 0,
    }).done((data) => {
        const messageCount = parseInt(data);
        if (messageCount > -1 && !isNaN(messageCount) && isFinite(messageCount)) {
            //Received valid count, load messages
            $.post("API.php", {
                cmd: "admin get page",
                adminKey: adminKey,
                page: 0,
            }).done((data) => {
                //===Redraw patination===
                //Calculate total pages
                let pageCount = Math.ceil(messageCount / 20);
                $("#div-admin-pagination").empty();
                //Draw pagination
                !pageCount && (pageCount++); //We will always draw page 0
                for (let i = 0; i < pageCount; i++) {
                    //Create inner elements
                    const linkElem = $("<a>").text((i).toString()).addClass("div-admin-pagination-a").data("index", i);
                    const liElem = $("<li>").append(linkElem);
                    //Set active state
                    if (i === currentPage) {
                        liElem.addClass("active");
                    }
                    //Put into container
                    $("#div-admin-pagination").append(liElem);
                }
                //Bind click event handler
                $(".div-admin-pagination-a").click(function () {
                    loadPage($(this).data("index"));
                });
                //===Draw page===
                //Parse response
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
                for (let i = 0; i < messages.length; i++) {
                    //Process data
                    let reference = messages[i].reference;
                    (reference.length > 50) && (reference = reference.substr(0, 47) + "...");
                    let message = messages[i].message;
                    (message.length > 150) && (message = message.substr(0, 147) + "...");
                    //Add to table
                    $("<tr>").append(
                        $("<td>").text(messages[i].ip),
                        $("<td>").text(reference),
                        $("<td>").text(message),
                        $("<td>").append(
                            $(`<button type="button" class="btn btn-primary div-admin-tbody-btn-view">&nbsp;View&nbsp;&nbsp;</button>`).data("index", i),
                            $(`<button type="button" class="btn btn-danger div-admin-tbody-btn-delete">Delete</button>`).data("id", messages[i].id),
                        ),
                    ).appendTo("#div-admin-tbody");
                }
                //Bind event handlers
                $(".div-admin-tbody-btn-view").click(function () {
                    const index = $(this).data("index");
                    msg("View Message", `Reference: ${messages[index].reference}\n\nMessage: ${messages[index].message}`);
                });
                $(".div-admin-tbody-btn-delete").click(function () {
                    //Ask server to delete message
                    $("#modal-wait-screen").modal("show");
                    $.post("API.php", {
                        cmd: "admin delete",
                        adminKey: adminKey,
                        id: $(this).data("id"),
                    }).done((data) => {
                        if (data === "ok") {
                            msg("Message Deleted", "The message is deleted.");
                            $(this).parent().parent().remove(); //Keyword "this" is carried in by arrow function
                        } else {
                            msg("Error", data);
                        }
                    }).fail(() => {
                        msg("Connection Error", "Please try again later.");
                    });
                });
                //Hide wait screen
                $("#modal-wait-screen").modal("hide");
            }).fail(() => {
                msg("Connection Error", "Please try again later.");
            });
        } else {
            //Assume data to be an error message
            msg("Error", data);
        }
    }).fail(() => {
        msg("Connection Error", "Please try again later.");
    });
};
//Admin button click event
$("#btn-admin").click(() => {
    //First time click initialization
    if (!activated) {
        //Show admin panel
        $("#div-admin").show();
        //Update the button
        $("#btn-admin").empty().append(
            $("<span>").addClass("glyphicon glyphicon-refresh"),
            " Refresh",
        ).removeClass("btn-danger").addClass("btn-info");
        //Flip the flag
        activated = true;
    }
    //Load current page, the variable has default value of 0
    loadPage(currentPage);
});
