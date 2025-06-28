import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

import XSvg from "../../../components/svgs/X";
import { MdOutlineMail, MdPassword } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { MdDriveFileRenameOutline } from "react-icons/md";

const SignUpPage = () => {
	const [formData, setFormData] = useState({
		email: "",
		username: "",
		fullName: "",
		password: "",
		verificationCode: "",
	});

	const [step, setStep] = useState(1);

	const sendVerification = useMutation({
		mutationFn: async ({ email }) => {
			const res = await fetch("/api/auth/request-verification-code", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error sending verification code");
			return data;
		},
		onSuccess: () => {
			toast.success("Verification code sent!");
			setStep(2);
		},
		onError: (err) => toast.error(err.message),
	});

	const completeSignup = useMutation({
		mutationFn: async (data) => {
			const res = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || "Signup failed");
			return json;
		},
		onSuccess: () => toast.success("Signup successful"),
		onError: (err) => toast.error(err.message),
	});

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSendCode = (e) => {
		e.preventDefault();
		sendVerification.mutate({ email: formData.email });
	};

	const handleFinalSubmit = (e) => {
		e.preventDefault();
		completeSignup.mutate(formData);
	};

	return (
		<div className="max-w-screen-xl mx-auto flex h-screen px-10">
			<div className="flex-1 hidden lg:flex items-center justify-center">
				<XSvg className="lg:w-2/3 fill-white" />
			</div>
			<div className="flex-1 flex flex-col justify-center items-center">
				<form
					className="lg:w-2/3 mx-auto md:mx-20 flex gap-4 flex-col"
					onSubmit={step === 1 ? handleSendCode : handleFinalSubmit}
				>
					<XSvg className="w-24 lg:hidden fill-white" />
					<h1 className="text-4xl font-extrabold text-white">
						{step === 1 ? "Join today." : "Verify & Finish"}
					</h1>

					

					{step === 1 && (
						<>
							<label className="input input-bordered rounded flex items-center gap-2">
									<MdOutlineMail />
									<input
										type="email"
										placeholder="Email"
										name="email"
										onChange={handleChange}
										value={formData.email}
										required
									/>
							</label>
							<div className="flex gap-4 flex-wrap">
								<label className="input input-bordered rounded flex items-center gap-2 flex-1">
									<FaUser />
									<input
										type="text"
										placeholder="Username"
										name="username"
										onChange={handleChange}
										value={formData.username}
										required
									/>
								</label>
								<label className="input input-bordered rounded flex items-center gap-2 flex-1">
									<MdDriveFileRenameOutline />
									<input
										type="text"
										placeholder="Full Name"
										name="fullName"
										onChange={handleChange}
										value={formData.fullName}
										required
									/>
								</label>
							</div>
							<button className="btn rounded-full btn-primary text-white">
								{sendVerification.isPending ? "Sending..." : "Send Verification Code"}
							</button>
						</>
					)}

					{step === 2 && (
						<>
							<label className="input input-bordered rounded flex items-center gap-2">
								<input
									type="text"
									placeholder="Verification Code"
									name="verificationCode"
									onChange={handleChange}
									value={formData.verificationCode}
									required
								/>
							</label>
							<label className="input input-bordered rounded flex items-center gap-2">
								<MdPassword />
								<input
									type="password"
									placeholder="Password"
									name="password"
									onChange={handleChange}
									value={formData.password}
									required
								/>
							</label>
							<button className="btn rounded-full btn-primary text-white">
								{completeSignup.isPending ? "Creating..." : "Sign Up"}
							</button>
						</>
					)}
				</form>

				<div className="flex flex-col lg:w-2/3 gap-2 mt-4">
					<p className="text-white text-lg">Already have an account?</p>
					<Link to="/login">
						<button className="btn rounded-full btn-primary text-white btn-outline w-full">
							Sign in
						</button>
					</Link>
				</div>
			</div>
		</div>
	);
};

export default SignUpPage;
