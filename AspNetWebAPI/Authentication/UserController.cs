using AspNetCoreAPI.Authentication.Dto;
using AspNetCoreAPI.Models;
using AspNetCoreAPI.Registration.dto;
using AspNetCoreAPI.Registration.Dto;
using AspNetCoreAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.IdentityModel.Tokens.Jwt;

namespace AspNetCoreAPI.Registration
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly JwtHandler _jwtHandler;
        private readonly RecaptchaService _recaptchaService;
        private readonly IConfiguration _configuration;

        public UserController(UserManager<User> userManager, JwtHandler jwtHandler, RecaptchaService recaptchaService, IConfiguration configuration)
        {
            _userManager = userManager;
            _jwtHandler = jwtHandler;
            _recaptchaService = recaptchaService;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDTO userLoginDto)
        {
            var isCaptchaValid = await _recaptchaService.VerifyCaptcha(userLoginDto.RecaptchaResponse);

            if(!isCaptchaValid)
                return BadRequest(new UserLoginResponseDTO { ErrorMessage = "Invalid reCAPTCHA.", IsAuthSuccessful = false });

            var user = await _userManager.FindByNameAsync(userLoginDto.Email);

            if (user == null || !await _userManager.CheckPasswordAsync(user, userLoginDto.Password))
                return Unauthorized(new UserLoginResponseDTO { ErrorMessage = "E-mailová adresa alebo heslo nie sú správne!", IsAuthSuccessful = false });

            if (user.IsBlocked) 
                return Unauthorized(new UserLoginResponseDTO { ErrorMessage = "Tento používateľ je zablokovaný!", IsAuthSuccessful = false });

            var signingCredentials = _jwtHandler.GetSigningCredentials();
            var claims = _jwtHandler.GetClaims(user);
            claims.AddRange(await _userManager.GetClaimsAsync(user));
            var tokenOptions = _jwtHandler.GenerateTokenOptions(signingCredentials, claims);
            var token = new JwtSecurityTokenHandler().WriteToken(tokenOptions);

            return Ok(new UserLoginResponseDTO { IsAuthSuccessful = true, Token = token, Username = user.UserName });
        }
        [HttpPost("add-claim")]
        public async Task<IActionResult> AddClaim([FromBody] ClaimDTO claimDto)
        {
            var user = await _userManager.FindByNameAsync(claimDto.UserEmail);
            var result = await _userManager.AddClaimAsync(user, new System.Security.Claims.Claim(claimDto.Type, claimDto.Value));

            return Ok(result.Succeeded);
        }
        [HttpGet("get-recaptcha-site-key")]
        public IActionResult GetRecaptchaSiteKey()
        {
            var siteKey = _configuration["GoogleReCaptcha:SiteKey"];
            if (string.IsNullOrEmpty(siteKey))
            {
                return NotFound("ReCAPTCHA site key is not configured.");
            }
            return Ok(siteKey);
        }
    }
}
